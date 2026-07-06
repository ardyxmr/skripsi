#!/bin/sh
# ExoVirt container entrypoint. Runs for app/worker/reverb/scheduler.
# The "app" service (RUN_MIGRATIONS=1) owns: stub seed, ansible key, migrate, config cache.
# The others just wait until the schema exists, then exec their command.
set -e
cd /var/www/html

echo "[entrypoint] waiting for postgres ${DB_HOST}:${DB_PORT:-5432} ..."
until php -r '$c=@fsockopen(getenv("DB_HOST"), (int)(getenv("DB_PORT")?:5432)); exit($c?0:1);'; do
  sleep 2
done

if [ "$RUN_MIGRATIONS" = "1" ]; then
  if [ -z "$APP_KEY" ]; then
    echo "[entrypoint] FATAL: APP_KEY kosong. Generate dulu:" >&2
    echo "  docker compose --env-file .env.docker run --rm --entrypoint php app artisan key:generate --show" >&2
    echo "  → tempel hasilnya ke APP_KEY di .env.docker, lalu 'up' lagi." >&2
    exit 1
  fi

  # Seed the Terraform stubs into the persistent volume (baked copy at /opt/master-provisioning).
  if [ ! -f storage/app/master-provisioning/terraform-structured/main.tf ]; then
    echo "[entrypoint] seeding terraform stubs ..."
    mkdir -p storage/app/master-provisioning
    cp -rn /opt/master-provisioning/. storage/app/master-provisioning/ 2>/dev/null || true
  fi

  # Ansible automation key — persisted so VMs provisioned earlier stay reachable.
  if [ ! -f storage/app/ansible/automation_key ]; then
    echo "[entrypoint] generating ansible automation key ..."
    mkdir -p storage/app/ansible
    ssh-keygen -t ed25519 -f storage/app/ansible/automation_key -N '' -C exovirt-ansible >/dev/null 2>&1 || true
    chmod 600 storage/app/ansible/automation_key 2>/dev/null || true
  fi

  echo "[entrypoint] migrating (NO seed → first-run installer creates the admin) ..."
  php artisan migrate --force
  php artisan storage:link 2>/dev/null || true
  php artisan config:cache
  php artisan route:cache
  php artisan event:cache
else
  echo "[entrypoint] waiting for migrations to finish ..."
  until php artisan migrate:status >/dev/null 2>&1; do
    sleep 2
  done
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
echo "[entrypoint] starting: $*"
exec "$@"
