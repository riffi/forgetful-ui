# Release Guide

## Prerequisites (one-time setup)

### 1. Create GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `write:packages`
4. Copy the token (it will only be shown once!)

### 2. Login to Docker Registry

```bash
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

You should see `Login Succeeded`

---

## Publishing a Release

### Step 1: Make sure Docker is running

Start Docker Desktop (or Docker daemon on Linux).

### Step 2: Navigate to project folder

```bash
cd forgetful-ui
```

### Step 3: Build and push

```bash
npm run release
```

This will:
- `npm run build` - build the frontend
- `npm run docker:build` - build Docker image
- `npm run docker:tag` - tag for ghcr.io
- `npm run docker:push` - push to registry

### Step 4: Done!

Image is available at:
```
ghcr.io/riffi/forgetful-ui:latest
```

---

## Troubleshooting

### "denied: permission denied"
Re-run the docker login command from Prerequisites.

### "Cannot connect to Docker daemon"
Start Docker Desktop / Docker daemon.

### Build failed
First check that local build works:
```bash
npm run build
```

---

## Individual Commands

| Action | Command |
|--------|---------|
| Build frontend only | `npm run build` |
| Build Docker image only | `npm run docker:build` |
| Push only | `npm run docker:push` |
| Full release | `npm run release` |

---

## Updating Production Server

After `npm run release` completes successfully, update the production server.

### Update UI only

```bash
ssh your-server
cd /path/to/forgetful-ui/docker
docker compose pull forgetful-ui
docker compose up -d forgetful-ui
```

### Update Backend only

```bash
ssh your-server
cd /path/to/forgetful-ui/docker
docker compose pull forgetful-service
docker compose up -d forgetful-service
```

### Update Everything

```bash
ssh your-server
cd /path/to/forgetful-ui/docker
docker compose pull
docker compose up -d
```

### Verify deployment

```bash
docker compose ps
docker compose logs --tail 20 forgetful-ui
docker compose logs --tail 20 forgetful-service
```

---

## Quick Copy-Paste Commands

**Update UI on server:**
```bash
cd /path/to/docker && docker compose pull forgetful-ui && docker compose up -d forgetful-ui
```

**Update backend on server:**
```bash
cd /path/to/docker && docker compose pull forgetful-service && docker compose up -d forgetful-service
```

**Update all on server:**
```bash
cd /path/to/docker && docker compose pull && docker compose up -d
```

---

## Rollback

If something breaks:

```bash
# List available images
docker images ghcr.io/riffi/forgetful-ui

# Rollback (stop and restart with previous cached image)
docker compose down forgetful-ui
docker compose up -d forgetful-ui
```
