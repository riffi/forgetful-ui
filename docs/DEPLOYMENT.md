# Production Deployment Guide

This guide covers deploying Forgetful UI with Traefik reverse proxy and GitHub OAuth authentication.

## Architecture

```
Internet
    │
    ▼
┌─────────┐
│ Traefik │  (HTTPS termination, routing)
└────┬────┘
     │
     ▼
┌──────────────┐
│ forgetful-ui │  (nginx:80 - static files + proxy)
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ forgetful-service│  (Python API :8020)
└──────────────────┘
```

## Prerequisites

- Docker and Docker Compose
- Traefik configured with Let's Encrypt
- Domain name with DNS pointing to your server
- GitHub OAuth App configured

## Setup GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in:
   - **Application name**: Forgetful
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/auth/callback`
3. Save Client ID and Client Secret for backend `.env`

## Docker Compose Configuration

### Option 1: UI in front of backend (Recommended)

The UI container handles all traffic and proxies API requests to the backend. This is the simplest setup for OAuth.

```yaml
name: forgetful

networks:
  forgetful:
  web:
    external: true

services:
  forgetful-ui:
    image: ghcr.io/riffi/forgetful-ui:latest
    container_name: forgetful-ui
    restart: unless-stopped
    networks:
      - forgetful
      - web
    depends_on:
      forgetful-service:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.forgetful.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.forgetful.entrypoints=websecure"
      - "traefik.http.routers.forgetful.tls.certresolver=letsencrypt"
      - "traefik.http.services.forgetful.loadbalancer.server.port=80"
      - "traefik.docker.network=web"

  forgetful-service:
    image: ghcr.io/scottrbk/forgetful:latest
    container_name: forgetful-service
    restart: unless-stopped
    env_file:
      - .env
    networks:
      - forgetful
    depends_on:
      forgetful-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8020/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 90s

  forgetful-db:
    image: pgvector/pgvector:pg16
    container_name: forgetful-db
    restart: unless-stopped
    networks:
      - forgetful
    env_file:
      - .env
    volumes:
      - forgetful_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U forgetful -d forgetful"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  forgetful_db_data:
```

### Option 2: Separate endpoints

If you need MCP clients to access the backend directly:

```yaml
services:
  # UI on app.your-domain.com
  forgetful-ui:
    labels:
      - "traefik.http.routers.forgetful-ui.rule=Host(`app.your-domain.com`)"
      # ... other labels

  # API on api.your-domain.com (for MCP)
  forgetful-service:
    networks:
      - forgetful
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.forgetful-api.rule=Host(`api.your-domain.com`)"
      - "traefik.http.routers.forgetful-api.entrypoints=websecure"
      - "traefik.http.routers.forgetful-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.forgetful-api.loadbalancer.server.port=8020"
      - "traefik.docker.network=web"
```

## Backend Environment Variables

Create `.env` file:

```env
# Database
POSTGRES_USER=forgetful
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=forgetful
DATABASE_URL=postgresql://forgetful:your-secure-password@forgetful-db:5432/forgetful

# OAuth (GitHub)
OAUTH_PROVIDER=github
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Server
SERVER_PORT=8020
```

## Deployment

```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Check status
docker compose ps
```

## OAuth Flow

1. User opens `https://your-domain.com`
2. Frontend detects OAuth is required (401 from API)
3. User clicks "Login with GitHub"
4. Frontend registers as OAuth client → `/register`
5. Frontend redirects to → `/authorize` → `/consent` → GitHub
6. User authorizes on GitHub
7. GitHub redirects to `https://your-domain.com/?code=...&state=...`
8. Frontend exchanges code for token → `POST /token`
9. Token stored in localStorage, user authenticated

## Proxied Endpoints

The UI nginx proxies these paths to the backend:

| Path | Description |
|------|-------------|
| `/api/*` | REST API |
| `/authorize` | OAuth authorization |
| `/consent` | OAuth consent page |
| `/token` | OAuth token exchange |
| `/register` | OAuth client registration |
| `/auth/*` | Auth callbacks |
| `/oauth/*` | OAuth endpoints |
| `/.well-known/*` | OAuth discovery |
| `/mcp` | MCP endpoint |
| `/sse` | SSE endpoint |
| `/health` | Health check |

## Troubleshooting

### 502 Bad Gateway on consent

Check nginx buffer sizes. The OAuth redirect URL can be large. Current config uses:
```
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

### 401 Unauthorized after login

1. Check browser DevTools → Application → Local Storage for `forgetful_token`
2. Check Console for errors during token exchange
3. Verify `/token` endpoint returns valid JWT

### OAuth callback not working

1. Verify GitHub OAuth App callback URL matches your domain
2. Check backend logs for OAuth errors
3. Ensure `/consent` is proxied (added in nginx.conf)

### View logs

```bash
# Backend logs
docker logs forgetful-service -f --tail 100

# Nginx logs (UI)
docker logs forgetful-ui -f --tail 100
```
