# =============================================================================
# AssoInCloud — Single multi-stage Dockerfile
# Builds backend (Spring Boot) and frontend (Next.js static export) and
# serves everything from a single Spring Boot process.
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
# Stage 2: Build the Next.js frontend (static export)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /build

# Copy package manifests first for dependency caching
COPY apps/frontend/package.json apps/frontend/package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/frontend/ .

# Build as static export so Spring Boot can serve the files directly
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_OUTPUT=export
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime — Spring Boot only
# ---------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

# ---------- Backend ----------
COPY --from=backend-build /build/target/backend.jar /app/backend.jar

# ---------- Frontend (static export) ----------
# Place the exported files where Spring Boot's resource handler can find them
COPY --from=frontend-build /build/out /app/static

# ---------- Entrypoint ----------
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data directory
RUN mkdir -p /data

# Default environment variables
ENV ASSOINCLOUD_DB_PATH=/data/assoincloud.db
ENV ASSOINCLOUD_PASSWORD=
ENV SERVER_PORT=8080
ENV JAVA_OPTS="-Xms128m -Xmx512m"

EXPOSE 8080

VOLUME ["/data"]

ENTRYPOINT ["/app/entrypoint.sh"]
