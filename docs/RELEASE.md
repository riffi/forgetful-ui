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

## Quick Release (recommended)

One command does everything:

```bash
npm run release:patch   # Bug fixes: 0.1.2 -> 0.1.3
npm run release:minor   # New features: 0.1.2 -> 0.2.0
npm run release:major   # Breaking changes: 0.1.2 -> 1.0.0
```

This automatically:
1. Bumps version in package.json
2. Commits the change
3. Creates git tag (e.g., `v0.1.3`)
4. Pushes commit and tag to GitHub
5. Builds frontend and Docker image
6. Pushes Docker image with `latest` and version tags

After script completes, create GitHub release (see below).

---

## Create GitHub Release with Notes

After the release script completes:

1. Open the link shown in terminal, or go to:
   https://github.com/riffi/forgetful-ui/releases/new

2. Select your tag (e.g., `v0.1.3`)

3. Fill in release title: `v0.1.3`

4. Write release notes using template:

```markdown
## What's Changed

### New Features
- Added feature X
- Implemented Y

### Bug Fixes
- Fixed issue with Z

### Improvements
- Improved performance of Q

**Full Changelog**: https://github.com/riffi/forgetful-ui/compare/v0.1.2...v0.1.3
```

5. Click **"Publish release"**

---

## Updating Production Server

```bash
ssh your-server
cd /opt/forgetful
docker compose pull forgetful-ui
docker compose up -d forgetful-ui
```

### Use specific version

```bash
# In docker-compose.yml or .env:
IMAGE_TAG=v0.1.3

docker compose pull forgetful-ui
docker compose up -d forgetful-ui
```

---

## Available Docker Tags

```
ghcr.io/riffi/forgetful-ui:latest     # Always latest
ghcr.io/riffi/forgetful-ui:v0.1.3     # Specific version
```

---

## Rollback

```bash
# Edit docker-compose.yml to use previous version
# image: ghcr.io/riffi/forgetful-ui:v0.1.2

docker compose down forgetful-ui
docker compose up -d forgetful-ui
```

---

## Manual Release (alternative)

If you need more control:

```bash
# 1. Edit version in package.json manually
# 2. Commit and tag
git add package.json
git commit -m "chore: release v0.1.3"
git tag -a v0.1.3 -m "Release v0.1.3"
git push && git push origin v0.1.3

# 3. Build and push (Windows)
npm run release

# 3. Build and push (Linux/Mac)
npm run release:unix
```

---

## Troubleshooting

### "denied: permission denied"
Re-run the docker login command from Prerequisites.

### "Cannot connect to Docker daemon"
Start Docker Desktop / Docker daemon.

### Build failed
```bash
npm run build  # Check if local build works
```

### Need to re-tag
```bash
docker tag forgetful-ui:latest ghcr.io/riffi/forgetful-ui:vX.Y.Z
docker push ghcr.io/riffi/forgetful-ui:vX.Y.Z
```
