#!/usr/bin/env bash
#
# Deploy FRONTEND-ONLY changes to the ExoVirt prod host.
# Run this ON the prod machine (the git checkout at /home/app/exovirt).
#
# It pulls the latest code and rebuilds the SPA. Nginx serves the static
# build from frontend/dist, so no service restart is needed — Vite hashes
# the bundle filenames, so browsers pick up the new assets on next load.
#
# Usage (on prod):
#   bash scripts/deploy-frontend.sh
# Override the app dir if different:
#   EXOVIRT_DIR=/srv/exovirt bash scripts/deploy-frontend.sh
#
set -euo pipefail

APP_DIR="${EXOVIRT_DIR:-/home/app/exovirt}"

echo "▶ App dir: $APP_DIR"
cd "$APP_DIR"

echo "▶ Pulling latest code (fast-forward only)…"
git pull --ff-only

echo "▶ Building the SPA (frontend/dist)…"
cd frontend
# npm ci keeps node_modules in lockstep with the lockfile. If deps are
# unchanged you can swap this for a plain `npm run build` to go faster.
npm ci
npm run build

echo "✅ Frontend deployed → $APP_DIR/frontend/dist"
echo "   Nginx already serves this dir. Hard-refresh the browser (Ctrl/Cmd+Shift+R) if the old page is cached."
