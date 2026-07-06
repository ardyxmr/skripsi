# syntax=docker/dockerfile:1
# ExoVirt — multi-stage image. One Dockerfile builds two targets:
#   - target "app": PHP-FPM 8.3 + Terraform + Ansible (used by app/worker/reverb/scheduler)
#   - target "web": Nginx serving the built SPA + proxying to app/reverb

# ---------- Stage 1: build the React/Vite SPA ----------
FROM node:20-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Vite bakes these at build time. VITE_REVERB_APP_KEY must match REVERB_APP_KEY in .env.docker.
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=ExoVirt
ARG VITE_REVERB_APP_KEY=exovirt-key
ARG VITE_IDLE_TIMEOUT_MIN=60
ARG VITE_IDLE_WARN_MIN=5
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_IDLE_TIMEOUT_MIN=$VITE_IDLE_TIMEOUT_MIN \
    VITE_IDLE_WARN_MIN=$VITE_IDLE_WARN_MIN
RUN npm run build      # → /app/frontend/dist

# ---------- Stage 2: PHP-FPM backend (+ Terraform + Ansible for the worker) ----------
FROM php:8.3-fpm-bookworm AS app
ENV COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /var/www/html

# System libs, PHP extensions, Ansible, Terraform, openssh (for the ansible automation key).
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      git unzip ca-certificates curl gnupg openssh-client \
      libpq-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev \
      ansible; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" pdo_pgsql gd zip bcmath mbstring pcntl opcache; \
    pecl install redis; docker-php-ext-enable redis; \
    curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg; \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(. /etc/os-release && echo "$VERSION_CODENAME") main" > /etc/apt/sources.list.d/hashicorp.list; \
    apt-get update; apt-get install -y --no-install-recommends terraform; \
    rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php.ini /usr/local/etc/php/conf.d/zzz-exovirt.ini

# Composer deps first for layer caching.
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# App source, then optimize the autoloader.
COPY backend/ ./
RUN composer dump-autoload --optimize --no-interaction

# Bake the Terraform stubs to a read-only seed dir; the entrypoint copies them into the
# persistent volume on first boot (the stubs are gitignored, so this replaces the manual scp).
COPY backend/storage/app/master-provisioning /opt/master-provisioning

# Recreate the storage skeleton (volumes mount over the data dirs) + perms.
RUN set -eux; \
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
             storage/logs storage/app/public storage/app/provisioning storage/app/ansible \
             storage/app/private storage/app/catalog-images bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]

# ---------- Stage 3: Nginx serving the SPA + reverse-proxying the app ----------
FROM nginx:1.27-bookworm AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/frontend/dist /usr/share/nginx/html
