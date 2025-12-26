# Docker Setup for Forgetful UI

## Quick Start (Development)

Add to your `docker-compose.yml` under `services:`:

```yaml
  forgetful-ui:
    image: ghcr.io/riffi/forgetful-ui:latest
    container_name: forgetful-ui
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    networks:
      - forgetful
    depends_on:
      forgetful-service:
        condition: service_healthy
```

Then run:
```bash
docker compose up -d --pull always
```

Frontend will be available at: http://localhost:3000

## Production Deployment

For production deployment with Traefik and OAuth, see **[DEPLOYMENT.md](../docs/DEPLOYMENT.md)**.

Key points:
- Place UI container in front of backend (handles all traffic)
- UI proxies all API/OAuth requests to backend internally
- Configure GitHub OAuth callback URL to your domain

## How it works

Nginx serves static files and proxies to `forgetful-service:8020`:

| Path | Description |
|------|-------------|
| `/api/*` | REST API |
| `/authorize`, `/consent`, `/token` | OAuth flow |
| `/register` | OAuth client registration |
| `/auth/*`, `/oauth/*` | Auth endpoints |
| `/.well-known/*` | OAuth discovery |
| `/mcp`, `/sse` | MCP/SSE (long-polling) |
| `/health` | Health check |

## Build locally

```bash
cd forgetful-ui
docker build -f docker/Dockerfile -t forgetful-ui .
docker run -p 3000:80 forgetful-ui
```
