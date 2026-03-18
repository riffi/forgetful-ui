#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get version type from argument (patch, minor, major)
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Usage: ./scripts/release.sh [patch|minor|major]${NC}"
    echo "  patch - bug fixes (0.1.2 -> 0.1.3)"
    echo "  minor - new features (0.1.2 -> 0.2.0)"
    echo "  major - breaking changes (0.1.2 -> 1.0.0)"
    exit 1
fi

echo -e "${YELLOW}Starting release (${VERSION_TYPE})...${NC}"

# Step 1: Bump version in package.json
echo -e "${GREEN}[1/6] Bumping version...${NC}"
npm version $VERSION_TYPE --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
echo "New version: v$VERSION"

# Step 2: Commit version change
echo -e "${GREEN}[2/6] Committing version change...${NC}"
git add package.json
git commit -m "chore: release v$VERSION"

# Step 3: Create git tag
echo -e "${GREEN}[3/6] Creating git tag...${NC}"
git tag -a "v$VERSION" -m "Release v$VERSION"

# Step 4: Push commit and tag
echo -e "${GREEN}[4/6] Pushing to remote...${NC}"
git push
git push origin "v$VERSION"

# Step 5: Build and push Docker images
echo -e "${GREEN}[5/6] Building Docker image...${NC}"
npm run build
npm run docker:build

echo -e "${GREEN}[6/6] Pushing Docker images...${NC}"
docker tag forgetful-ui:latest "ghcr.io/riffi/forgetful-ui:latest"
docker tag forgetful-ui:latest "ghcr.io/riffi/forgetful-ui:v$VERSION"
docker push "ghcr.io/riffi/forgetful-ui:latest"
docker push "ghcr.io/riffi/forgetful-ui:v$VERSION"

echo ""
echo -e "${GREEN}Release v$VERSION complete!${NC}"
echo ""
echo "Next step: Create GitHub release with notes"
echo "  https://github.com/riffi/forgetful-ui/releases/new?tag=v$VERSION"
echo ""
echo "Docker images:"
echo "  ghcr.io/riffi/forgetful-ui:latest"
echo "  ghcr.io/riffi/forgetful-ui:v$VERSION"
