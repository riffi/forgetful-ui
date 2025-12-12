# Forgetful UI

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Mantine](https://img.shields.io/badge/Mantine-7-339af0)

A modern web dashboard for managing your AI knowledge base powered by [Forgetful](https://github.com/ScottRBK/forgetful).

Browse memories, entities, projects, and visualize connections in an interactive knowledge graph.

## ✨ Features

- **Memories** - Create, edit, search and organize atomic knowledge units
- **Entities** - Track people, organizations, teams and their relationships
- **Knowledge Graph** - Interactive visualization of connections between memories and entities
- **Projects** - Organize knowledge by context
- **Global Project Filter** - Focus on specific project across all views

## 🚀 Quick Start

```bash
cd docker
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000 in your browser.

This starts the full stack:
- **Frontend** at http://localhost:3000
- **Backend** at http://localhost:8020

Edit `.env` to customize ports and settings.

## 🔧 Manual Setup

If you prefer running without Docker:

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python 3.12+](https://www.python.org/) with [uv](https://docs.astral.sh/uv/)

### 1. Start the Backend

```bash
uvx forgetful-ai --transport http --port 8020
```

### 2. Start the Frontend

```bash
npm install
npm run build
npm run preview
```

Open http://localhost:4173 in your browser.

### Configuration

Create `.env.local` before building to override API URL:

```env
VITE_API_URL=http://localhost:8020/api/v1
```
