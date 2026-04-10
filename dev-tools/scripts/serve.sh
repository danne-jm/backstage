#!/bin/bash

# Dev Server Manager — manages php artisan serve + npm run dev
# Usage: ./dev-tools/scripts/serve.sh [start|stop|restart|status|logs] [server]
#
# Servers:
#   php   — Laravel backend (php artisan serve)
#   vite  — Vite dev server (npm run dev)
#
# Examples:
#   ./dev-tools/scripts/serve.sh start              # start both
#   ./dev-tools/scripts/serve.sh stop               # stop both
#   ./dev-tools/scripts/serve.sh restart            # restart both
#   ./dev-tools/scripts/serve.sh status             # status of both
#   ./dev-tools/scripts/serve.sh logs php           # follow PHP server logs
#   ./dev-tools/scripts/serve.sh start vite         # start only Vite

SERVERS=("php" "vite")

pidfile() { echo "/tmp/backstage-serve-${1}.pid"; }
logfile() { echo "/tmp/backstage-serve-${1}.log"; }

start_server() {
    local SERVER=$1
    local PIDFILE=$(pidfile $SERVER)
    local LOGFILE=$(logfile $SERVER)

    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "  [$SERVER] Already running (PID: $(cat $PIDFILE))"
        return 0
    fi

    case "$SERVER" in
        php)
            nohup php artisan serve > "$LOGFILE" 2>&1 &
            ;;
        vite)
            nohup npm run dev > "$LOGFILE" 2>&1 &
            ;;
    esac

    echo $! > "$PIDFILE"
    echo "  [$SERVER] Started (PID: $(cat $PIDFILE)) — logs: $LOGFILE"
}

stop_server() {
    local SERVER=$1
    local PIDFILE=$(pidfile $SERVER)

    if [ ! -f "$PIDFILE" ]; then
        echo "  [$SERVER] Not running (no PID file)"
        return 0
    fi

    local PID=$(cat "$PIDFILE")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        rm "$PIDFILE"
        echo "  [$SERVER] Stopped (PID: $PID)"
    else
        echo "  [$SERVER] Process $PID not found, cleaning up PID file"
        rm "$PIDFILE"
    fi
}

status_server() {
    local SERVER=$1
    local PIDFILE=$(pidfile $SERVER)
    local LOGFILE=$(logfile $SERVER)

    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "  [$SERVER] Running (PID: $(cat $PIDFILE))"
        if [ -f "$LOGFILE" ]; then
            echo "    Last 5 log lines:"
            tail -n 5 "$LOGFILE" | sed 's/^/      /'
        fi
    else
        echo "  [$SERVER] Not running"
        [ -f "$PIDFILE" ] && rm "$PIDFILE"
    fi
}

# Determine which servers to operate on
if [ -n "$2" ] && [[ " ${SERVERS[@]} " =~ " $2 " ]]; then
    TARGET_SERVERS=("$2")
else
    TARGET_SERVERS=("${SERVERS[@]}")
fi

case "$1" in
    start)
        echo "Starting dev servers..."
        for S in "${TARGET_SERVERS[@]}"; do start_server $S; done
        ;;

    stop)
        echo "Stopping dev servers..."
        for S in "${TARGET_SERVERS[@]}"; do stop_server $S; done
        ;;

    restart)
        echo "Restarting dev servers..."
        for S in "${TARGET_SERVERS[@]}"; do stop_server $S; done
        sleep 1
        for S in "${TARGET_SERVERS[@]}"; do start_server $S; done
        ;;

    status)
        echo "Dev server status:"
        for S in "${TARGET_SERVERS[@]}"; do status_server $S; done
        ;;

    logs)
        if [ -z "$2" ]; then
            echo "Usage: $0 logs <server>"
            echo "Available: ${SERVERS[*]}"
            exit 1
        fi
        LOGFILE=$(logfile $2)
        if [ ! -f "$LOGFILE" ]; then
            echo "No log file found at $LOGFILE"
            exit 1
        fi
        tail -f "$LOGFILE"
        ;;

    *)
        echo "Dev Server Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs} [server]"
        echo ""
        echo "Servers: ${SERVERS[*]}"
        echo ""
        echo "Commands:"
        echo "  start   [server]  Start server(s)"
        echo "  stop    [server]  Stop server(s)"
        echo "  restart [server]  Restart server(s)"
        echo "  status  [server]  Show running status + last log lines"
        echo "  logs    <server>  Follow logs for a specific server (tail -f)"
        exit 1
        ;;
esac

exit 0
