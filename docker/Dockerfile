# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_BASE_URL=/api/v1

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# OCI image labels
LABEL org.opencontainers.image.title="Forgetful UI"
LABEL org.opencontainers.image.description="Web interface for Forgetful - personal knowledge management system"
LABEL org.opencontainers.image.source="https://github.com/riffi/forgetful-ui"
LABEL org.opencontainers.image.licenses="MIT"

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
