#!/usr/bin/env bash
#
# redis.sh — the two Redis instances for the InfraProv portal.
#   * Redis cache  :6379   (systemd: redis-server, allkeys-lru, ENABLED → auto-starts on boot)
#   * Redis queue  :6380   (redis-queue.conf, noeviction + AOF — jobs, sessions, Reverb pub/sub)
#
# The :6379 cache is a systemd service that comes up on boot; the :6380 instance is a user-run
# daemon (its conf has `daemonize yes`) and is the one you typically need to `start` after a reboot.
# Postgres is in postgres.sh; the Laravel app daemons in backend.sh.
#
# Usage:  ./redis.sh {start|stop|restart|status}
#
# sudo (for the :6379 systemd instance only): export INFRAPROV_SUDO_PASS to skip the prompt.
# ----------------------------------------------------------------------------------------------

REDIS_QUEUE_CONF="${REDIS_QUEUE_CONF:-/home/appd/redis-queue.conf}"

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"
  elif [ -n "${INFRAPROV_SUDO_PASS:-}" ]; then echo "$INFRAPROV_SUDO_PASS" | sudo -S "$@"
  else sudo "$@"; fi
}

redis_up() { redis-cli -p "$1" ping >/dev/null 2>&1; }

start() {
  echo "▶ Starting Redis…"
  if redis_up 6379; then echo "  ✓ cache :6379 already up"
  else run_root systemctl start redis-server && echo "  ✓ cache :6379 started"; fi

  if redis_up 6380; then
    echo "  ✓ queue :6380 already up"
  else
    redis-server "$REDIS_QUEUE_CONF"          # daemonize yes (per the conf)
    sleep 1
    redis_up 6380 && echo "  ✓ queue :6380 started" || echo "  ✗ queue :6380 FAILED (check $REDIS_QUEUE_CONF)"
  fi
  echo "Done."
}

stop() {
  echo "■ Stopping Redis…"
  # Queue instance: clean shutdown so the AOF is flushed (jobs + sessions are durable).
  if redis_up 6380; then redis-cli -p 6380 shutdown 2>/dev/null; echo "  ✓ queue :6380 stopped"
  else echo "  · queue :6380 not running"; fi

  if redis_up 6379; then run_root systemctl stop redis-server && echo "  ✓ cache :6379 stopped"
  else echo "  · cache :6379 not running"; fi
  echo "Done."
}

status() {
  echo "Redis:"
  redis_up 6379 && echo "  ✓ cache (LRU)  :6379  up   (boot auto-start: $(systemctl is-enabled redis-server 2>/dev/null))" \
                || echo "  ✗ cache (LRU)  :6379  DOWN"
  if redis_up 6380; then
    echo "  ✓ queue (AOF)  :6380  up   (jobs queued: $(redis-cli -p 6380 -n 0 LLEN infraprov-database-queues:default 2>/dev/null || echo '?'))"
  else
    echo "  ✗ queue (AOF)  :6380  DOWN"
  fi
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; echo; start ;;
  status)  status ;;
  *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
