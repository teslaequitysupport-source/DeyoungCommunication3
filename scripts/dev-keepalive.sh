#!/bin/bash
# Keep-alive guard for the Next.js dev server on port 3000.
# Only restarts when the port is truly unreachable (connection refused),
# never during slow compiles. Detached; logs to dev.log.
cd /home/z/my-project
while true; do
  # TCP-level probe: is anything listening on 3000?
  if ! (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    echo "[keep-alive $(date '+%H:%M:%S')] port 3000 is closed; starting dev server" >> dev.log
    pkill -f "next dev -p 3000" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 2
    nohup setsid bun run dev >> dev.log 2>&1 < /dev/null &
    disown 2>/dev/null || true
    # boot grace period: 40s before the next probe
    sleep 40
  fi
  sleep 5
done
