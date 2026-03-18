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

## Release Process

### Step 1: Bump version

```bash
# Choose one:
npm version patch --no-git-tag-version   # Bug fixes: 0.1.2 -> 0.1.3
npm version minor --no-git-tag-version   # New features: 0.1.2 -> 0.2.0
npm version major --no-git-tag-version   # Breaking changes: 0.1.2 -> 1.0.0
```

### Step 2: Commit and tag

```bash
# Get the new version
$VERSION = (Get-Content package.json | ConvertFrom-Json).version   # PowerShell
# or
VERSION=$(node -p "require('./package.json').version")              # Bash

# Commit
git add package.json
git commit -m "chore: release v$VERSION"

# Create tag
git tag -a "v$VERSION" -m "Release v$VERSION"
```

### Step 3: Push to GitHub

```bash
git push
git push origin "v$VERSION"
```

### Step 4: Build and push Docker image

```bash
npm run build
npm run docker:build

# Tag images (Windows PowerShell)
$VERSION = (Get-Content package.json | ConvertFrom-Json).version
docker tag forgetful-ui:latest "ghcr.io/riffi/forgetful-ui:latest"
docker tag forgetful-ui:latest "ghcr.io/riffi/forgetful-ui:v$VERSION"

# Push
docker push "ghcr.io/riffi/forgetful-ui:latest"
docker push "ghcr.io/riffi/forgetful-ui:v$VERSION"
```

### Step 5: Create GitHub Release with Notes

1. Go to: https://github.com/riffi/forgetful-ui/releases/new

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
