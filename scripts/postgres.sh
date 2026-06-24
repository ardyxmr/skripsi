#!/usr/bin/env bash
#
# postgres.sh — PostgreSQL control for the InfraProv portal.
#
# Postgres is a systemd service and is ENABLED, so it auto-starts on every boot — you rarely need
# this script. It exists for the occasional manual stop/restart (e.g. maintenance). Redis lives in
# redis.sh; the Laravel app daemons in backend.sh.
#
# Usage:  ./postgres.sh {start|stop|restart|status}
#
# sudo: start/stop/restart need root. Export INFRAPROV_SUDO_PASS to skip the prompt:
#   INFRAPROV_SUDO_PASS='...' ./postgres.sh restart
# ----------------------------------------------------------------------------------------------

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"
  elif [ -n "${INFRAPROV_SUDO_PASS:-}" ]; then echo "$INFRAPROV_SUDO_PASS" | sudo -S "$@"
  else sudo "$@"; fi
}

pg_up() { systemctl is-active --quiet postgresql; }

case "${1:-}" in
  start)
    if pg_up; then echo "✓ PostgreSQL already up"; else run_root systemctl start postgresql && echo "✓ PostgreSQL started"; fi ;;
  stop)
    if pg_up; then run_root systemctl stop postgresql && echo "✓ PostgreSQL stopped"; else echo "· PostgreSQL not running"; fi ;;
  restart)
    run_root systemctl restart postgresql && echo "✓ PostgreSQL restarted" ;;
  status)
    if pg_up; then echo "✓ PostgreSQL :5432 up   (boot auto-start: $(systemctl is-enabled postgresql 2>/dev/null))"
    else echo "✗ PostgreSQL :5432 DOWN (boot auto-start: $(systemctl is-enabled postgresql 2>/dev/null))"; fi ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
