#!/bin/bash

# Email Queue Manager — manages workers for all email queues
# Usage: ./dev-tools/scripts/queue.sh [start|stop|restart|status|logs] [queue]
#
# Queues:
#   distributions  — bulk email distributor (sent via Gmail OAuth)
#   confirmations  — order confirmation emails (sent via SMTP)
#
# Examples:
#   ./dev-tools/scripts/queue.sh start              # start both workers
#   ./dev-tools/scripts/queue.sh stop               # stop both workers
#   ./dev-tools/scripts/queue.sh status             # status of both
#   ./dev-tools/scripts/queue.sh logs distributions # follow logs for one queue
#   ./dev-tools/scripts/queue.sh start confirmations # start only one

QUEUES=("distributions" "confirmations")

pidfile()  { echo "/tmp/backstage-queue-${1}.pid"; }
logfile()  { echo "/tmp/backstage-queue-${1}.log"; }

start_worker() {
    local QUEUE=$1
    local PIDFILE=$(pidfile $QUEUE)
    local LOGFILE=$(logfile $QUEUE)

    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "  [$QUEUE] Already running (PID: $(cat $PIDFILE))"
        return 0
    fi

    nohup php artisan queue:work --queue=$QUEUE --tries=3 --timeout=60 > "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    echo "  [$QUEUE] Started (PID: $(cat $PIDFILE)) — logs: $LOGFILE"
}

stop_worker() {
    local QUEUE=$1
    local PIDFILE=$(pidfile $QUEUE)

    if [ ! -f "$PIDFILE" ]; then
        echo "  [$QUEUE] Not running (no PID file)"
        return 0
    fi

    local PID=$(cat "$PIDFILE")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        rm "$PIDFILE"
        echo "  [$QUEUE] Stopped (PID: $PID)"
    else
        echo "  [$QUEUE] Process $PID not found, cleaning up PID file"
        rm "$PIDFILE"
    fi
}

status_worker() {
    local QUEUE=$1
    local PIDFILE=$(pidfile $QUEUE)
    local LOGFILE=$(logfile $QUEUE)

    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "  [$QUEUE] Running (PID: $(cat $PIDFILE))"
        if [ -f "$LOGFILE" ]; then
            echo "    Last 5 log lines:"
            tail -n 5 "$LOGFILE" | sed 's/^/      /'
        fi
    else
        echo "  [$QUEUE] Not running"
        [ -f "$PIDFILE" ] && rm "$PIDFILE"
    fi
}

# Determine which queues to operate on
if [ -n "$2" ] && [[ " ${QUEUES[@]} " =~ " $2 " ]]; then
    TARGET_QUEUES=("$2")
else
    TARGET_QUEUES=("${QUEUES[@]}")
fi

case "$1" in
    start)
        echo "Starting queue workers..."
        for Q in "${TARGET_QUEUES[@]}"; do start_worker $Q; done
        ;;

    stop)
        echo "Stopping queue workers..."
        for Q in "${TARGET_QUEUES[@]}"; do stop_worker $Q; done
        ;;

    restart)
        echo "Restarting queue workers..."
        for Q in "${TARGET_QUEUES[@]}"; do stop_worker $Q; done
        sleep 1
        for Q in "${TARGET_QUEUES[@]}"; do start_worker $Q; done
        ;;

    status)
        echo "Queue worker status:"
        for Q in "${TARGET_QUEUES[@]}"; do status_worker $Q; done
        ;;

    logs)
        if [ -z "$2" ]; then
            echo "Usage: $0 logs <queue>"
            echo "Available: ${QUEUES[*]}"
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
        echo "Email Queue Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs} [queue]"
        echo ""
        echo "Queues: ${QUEUES[*]}"
        echo ""
        echo "Commands:"
        echo "  start   [queue]  Start worker(s)"
        echo "  stop    [queue]  Stop worker(s)"
        echo "  restart [queue]  Restart worker(s)"
        echo "  status  [queue]  Show running status + last log lines"
        echo "  logs    <queue>  Follow logs for a specific queue (tail -f)"
        exit 1
        ;;
esac

exit 0
