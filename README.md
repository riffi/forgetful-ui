# Forgetful UI

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Mantine](https://img.shields.io/badge/Mantine-7-339af0)

A modern web dashboard for managing your AI knowledge base powered by [Forgetful](https://github.com/ScottRBK/forgetful).

Browse memories, entities, projects, and visualize connections in an interactive knowledge graph.

![Forgetful UI](github-big-logo.jpeg)

## ✨ Features

- **Memories** - Create, edit, search and organize atomic knowledge units
- **Entities** - Track people, organizations, teams and their relationships
- **Knowledge Graph** - Interactive visualization of connections between memories and entities
- **Projects** - Organize knowledge by context
- **Global Project Filter** - Focus on specific project across all views

## 🚀 Quick Start (Docker)

Add to your existing `docker-compose.yml`:

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

Open http://localhost:3000 in your browser.

> The frontend proxies all API requests to `forgetful-service:8020` automatically.

## 🐳 Full Stack (Docker Compose)

To run both frontend and backend together:

```bash
cd docker
cp .env.example .env
docker compose up -d
```

This starts:
- **Frontend** at http://localhost:3000
- **Backend** at http://localhost:8020

Edit `.env` to customize ports and settings.

## 🔧 Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- Running [Forgetful](https://github.com/ScottRBK/forgetful) backend

### Start Development Server

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Configuration

Create `.env.local` to override API URL:

```env
VITE_API_URL=http://localhost:8020/api/v1
```

## 🌐 Production Deployment

For production deployment with **Traefik** and **GitHub OAuth**, see the [Deployment Guide](docs/DEPLOYMENT.md).

Key architecture:
```
Internet → Traefik (HTTPS) → forgetful-ui (nginx) → forgetful-service (API)
```

The UI container proxies all API and OAuth requests to the backend, making it easy to deploy behind a reverse proxy with SSL.

## 📦 Docker Build

Build the image locally:

```bash
docker build -f docker/Dockerfile -t forgetful-ui .
docker run -p 3000:80 forgetful-ui
```
