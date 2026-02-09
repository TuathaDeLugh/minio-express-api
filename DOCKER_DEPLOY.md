# Docker Deployment Guide

## Overview

This guide covers deploying the MinIO Express API using Docker and Docker Compose with the updated configuration supporting all new features including configurable file upload limits and Swagger documentation.

---

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- MinIO server (local or remote)

---

## Quick Start

### 1. Configure Environment

```bash
# Navigate to project directory
cd minio-express-api

# Edit .env with your MinIO configuration
nano .env
```

### 2. Build and Run

```bash
# Build and start the container (use sudo if needed)
docker compose up -d --build

# View logs
docker compose logs -f storage-api

# Check health status
docker compose ps
```

### 3. Access the API

- **API Base**: `http://localhost:4000`
- **Swagger Docs**: `http://localhost:4000/api` (requires authentication)
- **Health Check**: `http://localhost:4000/files`

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# MinIO Configuration
MINIO_ENDPOINT=storage.umangsailor.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# Application Configuration
PORT=4000
BUCKET_NAME=testing
API_ENDPOINT=bucket.umangsailor.com

# File Upload Configuration
MAX_UPLOAD_FILES=20
MAX_FILE_SIZE_MB=1024

# Swagger Configuration
SWAGGER_USER=admin
SWAGGER_PASS=your-secure-password
```

### Docker Compose Override

For custom configurations, create `docker-compose.override.yml`:

```yaml
version: "3.8"

services:
  storage-api:
    ports:
      - "8080:4000" # Custom port mapping
    environment:
      MAX_UPLOAD_FILES: 50 # Override default
```

---

## Dockerfile Details

### Multi-Stage Build

The Dockerfile uses a two-stage build process:

#### Stage 1: Builder

- Uses Node.js 20 Alpine image
- Installs all dependencies (including dev dependencies)
- Compiles TypeScript to JavaScript
- Creates optimized production build

#### Stage 2: Runtime

- Uses Node.js 20 Alpine image (smaller footprint)
- Installs only production dependencies
- Copies compiled application from builder stage
- Runs as non-root user for security
- Includes health check endpoint

### Key Features

✅ **Alpine Linux** - Smaller image size (~150MB vs ~900MB)
✅ **Multi-stage build** - Optimized production image
✅ **Health checks** - Automatic container health monitoring
✅ **Non-root user** - Enhanced security
✅ **Production ready** - NODE_ENV=production set automatically

---

## Docker Commands

### Build

```bash
# Build image
docker-compose build

# Build without cache
docker-compose build --no-cache

# Build specific service
docker-compose build storage-api
```

### Run

```bash
# Start in detached mode
docker-compose up -d

# Start with build
docker-compose up -d --build

# Start and view logs
docker-compose up
```

### Manage

```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Restart service
docker-compose restart storage-api
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service logs
docker-compose logs storage-api
```

### Health Check

```bash
# Check container health
docker-compose ps

# Inspect health status
docker inspect storage-api --format='{{.State.Health.Status}}'

# View health check logs
docker inspect storage-api --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

---

## Production Deployment

### 1. Using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# With custom config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Using Docker Run

```bash
# Build image
docker build -t storage-api:latest .

# Run container
docker run -d \
  --name storage-api \
  -p 4000:4000 \
  -e MINIO_ENDPOINT=storage.umangsailor.com \
  -e MINIO_PORT=443 \
  -e MINIO_USE_SSL=true \
  -e MINIO_ACCESS_KEY=your-access-key \
  -e MINIO_SECRET_KEY=your-secret-key \
  -e MAX_UPLOAD_FILES=20 \
  -e SWAGGER_USER=admin \
  -e SWAGGER_PASS=secure-password \
  --restart unless-stopped \
  storage-api:latest
```

### 3. Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml storage-stack

# List services
docker service ls

# View logs
docker service logs storage-stack_storage-api
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs storage-api

# Check container status
docker-compose ps

# Inspect container
docker inspect storage-api
```

### Health Check Failing

```bash
# Check health status
docker-compose ps

# Test endpoint manually
curl http://localhost:4000/files

# View detailed health logs
docker inspect storage-api --format='{{json .State.Health}}' | jq
```

### Permission Issues

```bash
# If running as root is needed (not recommended)
# Modify Dockerfile and remove: USER node

# Better: Fix file permissions
chown -R 1000:1000 /path/to/data
```

### Build Failures

```bash
# Clear build cache
docker-compose build --no-cache

# Remove old images
docker image prune -a

# Check disk space
docker system df
```

---

## Security Best Practices

### 1. Environment Variables

❌ **Don't** commit `.env` files to version control
✅ **Do** use Docker secrets or environment variable injection

```bash
# Using Docker secrets (Swarm mode)
echo "your-secret-key" | docker secret create minio_secret_key -
```

### 2. Network Isolation

```yaml
# Use custom networks
networks:
  storage-network:
    driver: bridge
    internal: true # No external access
```

### 3. Resource Limits

```yaml
services:
  storage-api:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

### 4. Read-only Filesystem

```yaml
services:
  storage-api:
    read_only: true
    tmpfs:
      - /tmp
```

---

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats storage-api

# One-time stats
docker stats --no-stream storage-api
```

### Health Monitoring

```bash
# Continuous health check
watch -n 5 'docker inspect storage-api --format="{{.State.Health.Status}}"'
```

### Log Aggregation

```yaml
services:
  storage-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Updating the Application

### Rolling Update

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Verify health
docker-compose ps
```

### Zero-Downtime Update

```bash
# Scale up new version
docker-compose up -d --scale storage-api=2

# Wait for health check
sleep 10

# Remove old container
docker-compose up -d --scale storage-api=1
```

---

## Backup and Restore

### Backup Configuration

```bash
# Backup .env file
cp .env .env.backup

# Backup docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup
```

### Export/Import Images

```bash
# Export image
docker save storage-api:latest | gzip > storage-api.tar.gz

# Import image
docker load < storage-api.tar.gz
```

---

## Summary

✅ Multi-stage Docker build for optimized images
✅ Health checks for automatic monitoring
✅ All environment variables configurable
✅ Production-ready with security best practices
✅ Easy deployment with Docker Compose
✅ Comprehensive troubleshooting guide

For issues or questions, check the logs first:

```bash
docker-compose logs -f storage-api
```
