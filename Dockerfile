# =============================================================================
# AssoInCloud — Single multi-stage Dockerfile
# Builds backend (Spring Boot) and frontend (Next.js) and runs both behind
# nginx as reverse proxy.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the Spring Boot backend
# ---------------------------------------------------------------------------
FROM eclipse-temurin:17-jdk-jammy AS backend-build

WORKDIR /build

# Copy Maven wrapper and POM first for dependency caching
COPY apps/backend/mvnw apps/backend/mvnw.cmd ./
COPY apps/backend/.mvn .mvn
COPY apps/backend/pom.xml .

# Download dependencies (cached layer)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build
COPY apps/backend/src src
RUN ./mvnw package -DskipTests -B && \
    mv target/*.jar target/backend.jar

# ---------------------------------------------------------------------------
# Stage 2: Build the Next.js frontend
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /build

# Copy package manifests first for dependency caching
COPY apps/frontend/package.json apps/frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend/ .

# Build with API URL set to relative /api so nginx can proxy
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-jammy AS runtime

# Install Node.js 20 and nginx
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs nginx && \
    apt-get purge -y gnupg && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- Backend ----------
COPY --from=backend-build /build/target/backend.jar /app/backend.jar

# ---------- Frontend (standalone) ----------
COPY --from=frontend-build /build/.next/standalone /app/frontend/
COPY --from=frontend-build /build/.next/static     /app/frontend/.next/static
COPY --from=frontend-build /build/public            /app/frontend/public

# ---------- Nginx config ----------
COPY docker/nginx.conf /etc/nginx/nginx.conf

# ---------- Entrypoint ----------
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data directory
RUN mkdir -p /data

# Default environment variables
ENV ASSOINCLOUD_DB_PATH=/data/assoincloud.db
ENV ASSOINCLOUD_PASSWORD=
ENV SERVER_PORT=8080
ENV FRONTEND_PORT=3000
ENV NGINX_PORT=80

EXPOSE 80

VOLUME ["/data"]

ENTRYPOINT ["/app/entrypoint.sh"]
