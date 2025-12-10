План: Forgetful UI Dashboard
Контекст
UI dashboard для Forgetful MCP сервера. Согласовано с maintainer'ом - отдельный репозиторий с независимым release cycle.
Архитектура
Репозиторий: forgetful-ui (отдельный от основного Forgetful)
Stack: Vite + React + TypeScript + Mantine + TanStack Query + npm
Docker образ: ghcr.io/[owner]/forgetful-ui
Dev: Vite proxy на localhost:8020 (CORS не нужен)
Prod: Nginx контейнер (статика + proxy /api/ на forgetful-service)
Функциональность
Dashboard для визуализации данных из Forgetful API:
Memories: список, поиск, детали
Entities: список, связи
Projects: список, связанные memories
Graph: визуализация связей между memories (react-force-graph-2d)
Структура репозитория
forgetful-ui/
├── src/
│   ├── api/          # API client для Forgetful REST API
│   ├── components/   # UI компоненты (layout, memories, entities, projects, graph)
│   ├── pages/        # Страницы (Dashboard, Memories, Entities, Projects, GraphView)
│   ├── hooks/        # React hooks для данных
│   └── types/        # TypeScript типы
├── docker/           # Dockerfile + nginx.conf
├── .github/workflows # CI (lint, build) + Publish (Docker image на теги)
└── ...config files
CI/CD
CI: На каждый push/PR - type-check, lint, build
Publish: На теги v* - build и push Docker image в GHCR
Интеграция с Forgetful
Maintainer добавит в основной репо docker-compose.with-ui.yml который подтягивает образ forgetful-ui и связывает с forgetful-service через Docker network.
Порядок реализации
Создать репозиторий forgetful-ui
Scaffolding (Vite + React + TypeScript)
Настроить Mantine, React Router, TanStack Query
Docker setup (Dockerfile + nginx.conf)
GitHub Actions (CI + Publish)
API client для Forgetful endpoints
Layout (Header, Sidebar)
Страницы: Dashboard → Memories → Entities → Projects → Graph
Первый релиз (tag v0.1.0 → Docker image)
Сообщить maintainer'у для интеграции