#!/bin/bash
set -e

# =============================================================================
# AssoInCloud — Container Entrypoint
# Starts the Spring Boot backend, which also serves the frontend static files.
# =============================================================================

ASSOINCLOUD_DB_PATH="${ASSOINCLOUD_DB_PATH:-/data/assoincloud.db}"
SERVER_PORT="${SERVER_PORT:-8080}"
JAVA_OPTS="${JAVA_OPTS:--Xms128m -Xmx512m}"

# Ensure the database directory exists
DB_DIR=$(dirname "$ASSOINCLOUD_DB_PATH")
mkdir -p "$DB_DIR"

echo "======================================="
echo " AssoInCloud — Starting"
echo "======================================="
echo " DB path:      $ASSOINCLOUD_DB_PATH"
echo " Backend port: $SERVER_PORT"
echo " JAVA_OPTS:    $JAVA_OPTS"
echo "======================================="

exec java $JAVA_OPTS \
    -DASSOINCLOUD_DB_PATH="$ASSOINCLOUD_DB_PATH" \
    -Dserver.port="$SERVER_PORT" \
    -jar /app/backend.jar
