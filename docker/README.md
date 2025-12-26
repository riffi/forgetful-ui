# Docker Setup for Forgetful UI

## Quick Start

Add to your `docker-compose.local.yml` under `services:`:

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
docker compose -f docker-compose.local.yml up -d --pull always
```

Frontend will be available at: http://localhost:3000

## How it works

- Nginx serves static files and proxies `/api/*` to `forgetful-service:8020`
- All OAuth endpoints (`/oauth/`, `/authorize`, `/token`, etc.) are also proxied
- SSE/MCP endpoints are configured for long-polling

## Build locally

```bash
cd forgetful-ui
docker build -f docker/Dockerfile -t forgetful-ui .
docker run -p 3000:80 forgetful-ui
```
