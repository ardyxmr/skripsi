#!/usr/bin/env bash
#
# backend.sh — the InfraProv Laravel app daemons (the ones you restart often).
#   * serve      php artisan serve  (8 workers, :8000)   — restart after .env / config / controller edits
#   * reverb     php artisan reverb:start (:8080)         — WebSocket push
#   * worker1/2  php artisan queue:work redis             — restart after job / observer / config edits
#   * scheduler  php artisan schedule:work                — restart after routes/console.php edits
#
# The persistent data layer (Postgres + Redis :6379/:6380) lives in data-services.sh — start that
# first. This script does NOT touch `npm run dev` (the frontend is run separately).
#
# Each daemon runs via setsid in its own process group; the PID (group leader) is tracked in a
# pidfile so stop/restart are reliable. Logs go to storage/logs/daemons/.
#
# The pidfile/group kill is the primary path, but port-less daemons (queue:work / schedule:work)
# leave nothing to grab if a pidfile is overwritten or a daemon was started outside this script —
# strays then accumulate across restarts. So stop also runs a final reap sweep that matches each
# port-less daemon's full command AND verifies the process cwd is THIS backend (so we never touch
# another project's `php artisan` daemons that happen to share a command line). serve/reverb stay
# covered by the existing port-kill.
#
# Usage:  ./backend.sh {start|stop|restart|status|logs [name]}
# ----------------------------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$(dirname "$SCRIPT_DIR")/backend}"
LOG_DIR="$BACKEND_DIR/storage/logs/daemons"
RUN_DIR="$BACKEND_DIR/storage/run"

# name | command | logfile | port  (port is set only for daemons that bind one; blank otherwise)
DAEMONS=(
  "serve|env PHP_CLI_SERVER_WORKERS=8 php artisan serve --no-reload --port=8000|serve.log|8000"
  "reverb|php artisan reverb:start --host=0.0.0.0 --port=8080|reverb.log|8080"
  "worker1|php artisan queue:work redis --timeout=600 --tries=1 --max-time=3600|worker1.log|"
  "worker2|php artisan queue:work redis --timeout=600 --tries=1 --max-time=3600|worker2.log|"
  "worker3|php artisan queue:work redis --timeout=600 --tries=1 --max-time=3600|worker3.log|"
  "worker4|php artisan queue:work redis --timeout=600 --tries=1 --max-time=3600|worker4.log|"
  "worker_sys|php artisan queue:work redis --queue=system --timeout=120 --tries=1 --max-time=3600|worker_sys.log|"
  "scheduler|php artisan schedule:work|scheduler.log|"
)

mkdir -p "$LOG_DIR" "$RUN_DIR"

pidfile()    { echo "$RUN_DIR/$1.pid"; }
is_running() { local p; p="$(cat "$(pidfile "$1")" 2>/dev/null)"; [ -n "$p" ] && kill -0 "$p" 2>/dev/null; }
redis_up()   { redis-cli -p "$1" ping >/dev/null 2>&1; }
tcp_up()     { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3>&- ; }

# PIDs of whatever is LISTENing on a local port (matches the last :segment of the local address).
port_pids()  { ss -ltnpH 2>/dev/null | awk -v p="$1" '{ split($4,a,":"); if (a[length(a)]==p) print }' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u; }

# PIDs whose full command matches $1 AND whose cwd is THIS backend. Used to reap port-less daemon
# strays without ever touching another project's `php artisan` daemons that share a command line.
# (pgrep -f matches a substring of the cmdline; the cwd check is what scopes it to us.)
backend_pids() {
  local pat="$1" pid cwd bd
  bd="$(readlink -f "$BACKEND_DIR" 2>/dev/null || echo "$BACKEND_DIR")"
  for pid in $(pgrep -f -- "$pat" 2>/dev/null); do
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null)"
    [ "$cwd" = "$bd" ] && printf '%s\n' "$pid"
  done
}

# Clear a port: `php artisan serve`/`reverb` fork detached children that escape the process group,
# so a clean restart must also kill whatever still holds the port.
kill_port() {
  local port="$1" pp
  [ -z "$(port_pids "$port")" ] && return 0
  for pp in $(port_pids "$port"); do kill -TERM "$pp" 2>/dev/null; done
  for _ in 1 2 3 4 5 6; do [ -z "$(port_pids "$port")" ] && return 0; sleep 0.5; done
  for pp in $(port_pids "$port"); do kill -KILL "$pp" 2>/dev/null; done
}

preflight() {
  local warn=0
  tcp_up 5432   || { echo "  ⚠ PostgreSQL :5432 down — run ./data-services.sh start"; warn=1; }
  redis_up 6379 || { echo "  ⚠ Redis cache :6379 down — run ./data-services.sh start"; warn=1; }
  redis_up 6380 || { echo "  ⚠ Redis queue :6380 down — run ./data-services.sh start"; warn=1; }
  # Stale jobs auto-drain into REAL VMs the moment a worker starts — surface them loudly.
  local q; q="$(redis-cli -p 6380 -n 0 LLEN infraprov-database-queues:default 2>/dev/null || echo 0)"
  [ "${q:-0}" -gt 0 ] 2>/dev/null && echo "  ⚠ $q job(s) already queued on :6380 — they will run as soon as a worker starts."
  return $warn
}

start_one() {
  local name="$1" cmd="$2" log="$3"
  if is_running "$name"; then echo "  · $name already running (pid $(cat "$(pidfile "$name")"))"; return; fi
  ( cd "$BACKEND_DIR" && setsid bash -c "exec $cmd" >"$LOG_DIR/$log" 2>&1 & echo $! > "$(pidfile "$name")" )
  sleep 0.3
  is_running "$name" && echo "  ✓ $name started (pid $(cat "$(pidfile "$name")"))" || echo "  ✗ $name FAILED — see $LOG_DIR/$log"
}

stop_one() {
  local name="$1" port="$2" p running=0; p="$(cat "$(pidfile "$name")" 2>/dev/null)"
  if [ -n "$p" ] && kill -0 "$p" 2>/dev/null; then
    running=1
    kill -TERM "-$p" 2>/dev/null || kill -TERM "$p" 2>/dev/null   # whole process group
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$p" 2>/dev/null || break; sleep 0.5; done
    kill -0 "$p" 2>/dev/null && { kill -KILL "-$p" 2>/dev/null || kill -KILL "$p" 2>/dev/null; }
  fi
  # Detached children (serve's php -S workers, reverb) escape the group — clear the port too.
  if [ -n "$port" ] && [ -n "$(port_pids "$port")" ]; then kill_port "$port"; running=1; fi
  rm -f "$(pidfile "$name")"
  [ "$running" -eq 1 ] && echo "  ✓ $name stopped" || echo "  · $name not running"
}

# Reap port-less daemon strays (queue:work / schedule:work) that escaped the pidfile/group kill —
# e.g. an overwritten pidfile or a daemon started by hand. Scoped to this backend via backend_pids.
# Never relies on pkill's exit status (it reports 144 on this host); kills explicit PIDs instead.
reap_strays() {
  local d name cmd log port pid killed=0
  for d in "${DAEMONS[@]}"; do
    IFS='|' read -r name cmd log port <<< "$d"
    [ -n "$port" ] && continue                         # serve/reverb: covered by kill_port
    for pid in $(backend_pids "$cmd"); do
      kill -TERM "$pid" 2>/dev/null && { killed=1; echo "  ↻ reaping stray $name (pid $pid)"; }
    done
  done
  [ "$killed" -eq 1 ] || return 0
  for _ in 1 2 3 4 5 6; do                             # give them a moment, then KILL leftovers
    local left=0
    for d in "${DAEMONS[@]}"; do
      IFS='|' read -r name cmd log port <<< "$d"; [ -n "$port" ] && continue
      [ -n "$(backend_pids "$cmd")" ] && left=1
    done
    [ "$left" -eq 0 ] && break; sleep 0.5
  done
  for d in "${DAEMONS[@]}"; do
    IFS='|' read -r name cmd log port <<< "$d"; [ -n "$port" ] && continue
    for pid in $(backend_pids "$cmd"); do kill -KILL "$pid" 2>/dev/null; echo "  ↻ force-killed stray $name (pid $pid)"; done
  done
  return 0
}

start() {
  echo "▶ Starting backend daemons…"
  preflight || echo "  (continuing despite warnings above)"
  ( cd "$BACKEND_DIR" && php artisan config:clear >/dev/null 2>&1 )   # pick up any .env/config edits (--no-reload serve caches)
  for d in "${DAEMONS[@]}"; do IFS='|' read -r name cmd log port <<< "$d"; start_one "$name" "$cmd" "$log"; done
  echo "Done."
}

stop() {
  echo "■ Stopping backend daemons…"
  for d in "${DAEMONS[@]}"; do IFS='|' read -r name cmd log port <<< "$d"; stop_one "$name" "$port"; done
  reap_strays   # mop up any port-less strays the pidfile/group kill missed
  echo "Done."
}

status() {
  echo "Backend daemons:"
  for d in "${DAEMONS[@]}"; do
    IFS='|' read -r name cmd log port <<< "$d"
    if is_running "$name"; then echo "  ✓ $name (pid $(cat "$(pidfile "$name")"))"; else echo "  ✗ $name DOWN"; fi
  done
  echo "Endpoints:"
  local code; code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:8000/api/health 2>/dev/null)"
  if [ -n "$code" ] && [ "$code" != "000" ]; then echo "  api/health  -> $code"; else echo "  api/health  -> unreachable"; fi
  tcp_up 8080 && echo "  reverb :8080 -> up" || echo "  reverb :8080 -> DOWN"
}

logs() {
  local name="${1:-}"
  if [ -n "$name" ]; then tail -n 40 -f "$LOG_DIR/$name.log"; else tail -n 20 "$LOG_DIR"/*.log; fi
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; echo; start ;;
  status)  status ;;
  logs)    logs "${2:-}" ;;
  *) echo "Usage: $0 {start|stop|restart|status|logs [name]}"; exit 1 ;;
esac
