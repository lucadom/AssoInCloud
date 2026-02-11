#!/bin/bash
set -e

# =============================================================================
# AssoInCloud — Container Entrypoint
# Starts the Spring Boot backend, Next.js frontend, and nginx reverse proxy.
# =============================================================================

# Defaults (can be overridden via environment variables)
ASSOINCLOUD_DB_PATH="${ASSOINCLOUD_DB_PATH:-/data/assoincloud.db}"
SERVER_PORT="${SERVER_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
JAVA_OPTS="${JAVA_OPTS:--Xms128m -Xmx512m}"

# Ensure the database directory exists
DB_DIR=$(dirname "$ASSOINCLOUD_DB_PATH")
mkdir -p "$DB_DIR"

echo "======================================="
echo " AssoInCloud — Starting services"
echo "======================================="
echo " DB path:       $ASSOINCLOUD_DB_PATH"
echo " Backend port:  $SERVER_PORT"
echo " Frontend port: $FRONTEND_PORT"
echo " JAVA_OPTS:     $JAVA_OPTS"
echo "======================================="

# ---- Trap for graceful shutdown ----
cleanup() {
    echo "Shutting down..."
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    [ -n "$NGINX_PID" ]    && kill "$NGINX_PID"    2>/dev/null || true
    wait 2>/dev/null
    echo "All services stopped."
    exit 0
}
trap cleanup SIGTERM SIGINT SIGQUIT

# ---- Start Spring Boot backend ----
echo "Starting backend..."
java $JAVA_OPTS \
    -DASSOINCLOUD_DB_PATH="$ASSOINCLOUD_DB_PATH" \
    -Dserver.port="$SERVER_PORT" \
    -jar /app/backend.jar &
BACKEND_PID=$!

# ---- Start Next.js frontend (standalone) ----
echo "Starting frontend..."
cd /app/frontend
HOSTNAME="0.0.0.0" PORT="$FRONTEND_PORT" node server.js &
FRONTEND_PID=$!
cd /app

# ---- Wait for backend to be ready ----
echo "Waiting for backend to be ready..."
for i in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:${SERVER_PORT}/api/invoices" > /dev/null 2>&1; then
        echo "Backend is ready."
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "WARNING: Backend did not become ready in 60 seconds, starting nginx anyway."
    fi
    sleep 1
done

# ---- Start nginx in foreground ----
echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "======================================="
echo " AssoInCloud is running on port 80"
echo "======================================="

# Wait for any process to exit
wait -n "$BACKEND_PID" "$FRONTEND_PID" "$NGINX_PID" 2>/dev/null

# If any process exits, shut everything down
echo "A service has stopped unexpectedly. Shutting down..."
cleanup
