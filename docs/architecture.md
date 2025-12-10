# Архитектура Forgetful-UI

## Обзор

Архитектурный план для forgetful-ui - React-дашборда для Forgetful MCP сервера.

### Исходные спецификации

| Документ | Описание |
|----------|----------|
| [ui-spec.yaml](spec/ui-spec.yaml) | UI спецификация: экраны, компоненты, palette, templates |
| [data-spec.yaml](spec/data-spec.yaml) | Модель данных: entities, enums, relations |
| [base-plan.md](base-plan.md) | Базовый план проекта и технологический стек |

## Технологический стек (из base-plan.md)

- **Фронтенд**: Vite + React + TypeScript
- **UI фреймворк**: Mantine
- **Работа с данными**: TanStack Query
- **Визуализация графа**: react-force-graph-2d
- **Пакетный менеджер**: npm

---

## 1. Структура проекта

> Структура основана на ui-spec.yaml (экраны, компоненты) и data-spec.yaml (типы данных)

```
forgetful-ui/
├── src/
│   ├── api/                    # API client layer
│   │   ├── client.ts           # Base fetch client with auth
│   │   ├── memories.ts         # Memory API endpoints
│   │   ├── entities.ts         # Entity API endpoints
│   │   ├── entity-relationships.ts  # Entity relationship API (from data-spec)
│   │   ├── projects.ts         # Project API endpoints
│   │   ├── documents.ts        # Document API endpoints
│   │   ├── code-artifacts.ts   # Code artifact API endpoints
│   │   ├── graph.ts            # Graph data API endpoints
│   │   ├── search.ts           # Unified search API
│   │   └── index.ts            # Re-exports
│   │
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # Layout components (from ui-spec templates)
│   │   │   ├── MainLayout.tsx      # Three-column layout (main_layout template)
│   │   │   ├── Sidebar.tsx         # Collapsible sidebar with nav
│   │   │   ├── DetailPanel.tsx     # Quick edit slide-in panel
│   │   │   └── GlobalSearch.tsx    # Global search input (Ctrl+K)
│   │   │
│   │   ├── common/             # Common reusable components
│   │   │   ├── TypeBadge.tsx       # Colored badge by entity type
│   │   │   ├── ImportanceBadge.tsx # Importance indicator (1-10)
│   │   │   ├── TagList.tsx         # Inline editable tags
│   │   │   ├── DataTable.tsx       # Generic data table with sorting
│   │   │   └── BulkActionsBar.tsx  # Sticky bar for multi-select actions (from ui-spec)
│   │   │
│   │   ├── graph/              # Graph visualization (from ui-spec graph screen)
│   │   │   ├── GraphCanvas.tsx     # react-force-graph-2d wrapper
│   │   │   ├── GraphToolbar.tsx    # Floating controls (zoom, layout, filters)
│   │   │   ├── GraphLegend.tsx     # Node types legend (bottom-left)
│   │   │   ├── GraphMinimap.tsx    # Viewport minimap (bottom-right)
│   │   │   └── GraphEmptyState.tsx # Empty state illustration
│   │   │
│   │   ├── modals/             # Modal dialogs (from ui-spec overlays)
│   │   │   ├── ItemEditor.tsx      # Create/edit modal (item_editor screen)
│   │   │   ├── SearchResults.tsx   # Search overlay (search_results screen)
│   │   │   └── ConfirmDialog.tsx   # Delete confirmation
│   │   │
│   │   └── auth/               # Auth components
│   │       ├── LoginForm.tsx
│   │       ├── OAuthButtons.tsx
│   │       ├── AuthGuard.tsx
│   │       ├── AuthWarning.tsx
│   │       └── UserMenu.tsx
│   │
│   ├── pages/                  # Page components (from ui-spec screens)
│   │   ├── Dashboard.tsx           # dashboard screen
│   │   ├── Memories.tsx            # memories screen (list)
│   │   ├── MemoryDetail.tsx        # memory_detail screen
│   │   ├── Entities.tsx            # entities screen (list)
│   │   ├── EntityDetail.tsx        # entity_detail screen
│   │   ├── Projects.tsx            # projects screen (card grid)
│   │   ├── ProjectDetail.tsx       # project_detail screen (tabs)
│   │   ├── Documents.tsx           # documents screen (list)
│   │   ├── DocumentDetail.tsx      # document_detail screen
│   │   ├── CodeArtifacts.tsx       # code_artifacts screen (list)
│   │   ├── CodeArtifactDetail.tsx  # code_artifact_detail screen
│   │   ├── Graph.tsx               # graph screen (full viewport)
│   │   ├── Login.tsx               # Auth login page
│   │   └── AuthCallback.tsx        # OAuth callback handler
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useDetailPanel.ts   # Detail panel open/close state
│   │   ├── useGlobalSearch.ts  # Global search (Ctrl+K)
│   │   └── queries/            # TanStack Query hooks
│   │       ├── useMemories.ts
│   │       ├── useEntities.ts
│   │       ├── useProjects.ts
│   │       ├── useDocuments.ts
│   │       ├── useCodeArtifacts.ts
│   │       ├── useGraph.ts
│   │       └── useSearch.ts
│   │
│   ├── types/                  # TypeScript types (from data-spec.yaml)
│   │   ├── memory.ts               # Memory entity + MemoryCreate/Update
│   │   ├── entity.ts               # Entity entity
│   │   ├── entity-relationship.ts  # EntityRelationship entity
│   │   ├── project.ts              # Project entity
│   │   ├── document.ts             # Document entity
│   │   ├── code-artifact.ts        # CodeArtifact entity
│   │   ├── enums.ts                # EntityType, ProjectType, ProjectStatus (from data-spec enums)
│   │   ├── graph.ts                # Graph node/edge types for visualization
│   │   └── index.ts                # Re-exports all types
│   │
│   ├── context/                # React context providers
│   │   ├── AuthContext.tsx     # Auth state management
│   │   └── UIContext.tsx       # Sidebar collapsed, detail panel state
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts       # Date, size formatters
│   │   └── colors.ts           # Type-to-color mapping
│   │
│   ├── styles/                 # Global styles, theme
│   │   └── theme.ts            # Mantine theme (glassmorphism from ui-spec palette)
│   │
│   ├── App.tsx                 # Root component with routing
│   └── main.tsx                # Entry point
│
├── docker/
│   ├── Dockerfile              # Multi-stage build
│   ├── nginx.conf              # Nginx configuration
│   ├── docker-compose.yml      # Full stack (backend + UI)
│   └── docker-compose.dev.yml  # Dev mode (backend only)
│
├── public/                     # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 2. Сборка и разработка

### Режим разработки

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      }
    }
  }
})
```

**Процесс разработки**:
1. Бэкенд запущен на `localhost:8020`
2. Vite dev server на `localhost:3000`
3. Vite проксирует `/api/*` на бэкенд (без проблем с CORS)

### Продакшн сборка

```bash
npm run build  # Создаёт dist/ со статическими файлами
```

---

## 3. Конфигурация Docker

### Dockerfile (Multi-stage сборка)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA роутинг - отдаём index.html для всех маршрутов
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксируем API запросы на бэкенд
    location /api/ {
        proxy_pass http://forgetful-service:8020/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Пробрасываем заголовок авторизации
        proxy_set_header Authorization $http_authorization;
    }

    # Проксируем health check
    location /health {
        proxy_pass http://forgetful-service:8020/health;
    }

    # Кэшируем статику
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml (в репозитории forgetful-ui)

**Важно**: Храним в репо forgetful-ui, т.к. нет прав на изменение бэкенда.

```yaml
# docker/docker-compose.yml
version: "3.8"

name: forgetful-stack

services:
  # Бэкенд - используем готовый образ
  forgetful-service:
    image: ghcr.io/${FORGETFUL_IMAGE:-anthropics/forgetful}:${FORGETFUL_TAG:-latest}
    container_name: forgetful-service
    restart: unless-stopped
    ports:
      - "${BACKEND_BIND_ADDRESS:-127.0.0.1}:${BACKEND_PORT:-8020}:8020"
    env_file:
      - path: .env
        required: false
    environment:
      - DATABASE=${DATABASE:-SQLite}
      - SQLITE_PATH=/app/data/forgetful.db
    volumes:
      - forgetful_data:/app/data
    networks:
      - forgetful
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8020/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 90s

  # UI - собираем из текущего репо
  forgetful-ui:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    image: ghcr.io/${UI_IMAGE:-anthropics/forgetful-ui}:${UI_TAG:-latest}
    container_name: forgetful-ui
    restart: unless-stopped
    ports:
      - "${UI_BIND_ADDRESS:-127.0.0.1}:${UI_PORT:-3000}:80"
    depends_on:
      forgetful-service:
        condition: service_healthy
    networks:
      - forgetful

networks:
  forgetful:
    driver: bridge

volumes:
  forgetful_data:
```

### docker-compose.dev.yml (для разработки с hot-reload)

```yaml
# docker/docker-compose.dev.yml
version: "3.8"

services:
  forgetful-service:
    # Только бэкенд для разработки UI
    image: ghcr.io/anthropics/forgetful:latest
    ports:
      - "127.0.0.1:8020:8020"
    environment:
      - DATABASE=SQLite
    volumes:
      - ./dev-data:/app/data
```

**Использование**:
```bash
# Разработка UI (бэкенд в Docker, UI локально)
docker compose -f docker/docker-compose.dev.yml up -d
npm run dev

# Полный стек (оба в Docker)
docker compose -f docker/docker-compose.yml up -d --build
```

---

## 4. Авторизация (полная поддержка всех вариантов)

### Варианты авторизации в Forgetful бэкенде

Бэкенд поддерживает следующие режимы (через `FASTMCP_SERVER_AUTH`):

| Режим | Описание | Требования UI |
|-------|----------|---------------|
| **Отключена** (default) | Все запросы используют default user | Показать предупреждение |
| **JWT** | Валидация JWT через JWKS | Страница логина, хранение токена |
| **Token Introspection** | OAuth 2.0 RFC 7662 | Страница логина, хранение токена |
| **GitHub OAuth** | OAuth через GitHub | Кнопка "Login with GitHub" |
| **Google OAuth** | OAuth через Google | Кнопка "Login with Google" |

### Структура файлов авторизации

```
src/
├── context/
│   └── AuthContext.tsx       # Глобальный контекст авторизации
├── pages/
│   └── Login.tsx             # Страница логина с выбором провайдера
├── components/
│   └── auth/
│       ├── LoginForm.tsx     # Форма логина (для JWT)
│       ├── OAuthButtons.tsx  # Кнопки OAuth провайдеров
│       ├── AuthGuard.tsx     # Защита маршрутов
│       ├── AuthWarning.tsx   # Предупреждение "Auth disabled"
│       └── UserMenu.tsx      # Меню пользователя в header
└── hooks/
    └── useAuth.ts            # Хук для работы с auth
```

### AuthContext - центральный менеджер авторизации

```typescript
// src/context/AuthContext.tsx
interface AuthState {
  // Состояние
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;

  // Информация о бэкенде
  authMode: 'disabled' | 'jwt' | 'oauth' | 'unknown';
  oauthProviders: string[]; // ['github', 'google']

  // Действия
  login: (provider?: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({...});

  // При старте: определяем режим авторизации бэкенда
  useEffect(() => {
    detectAuthMode();
  }, []);

  async function detectAuthMode() {
    // 1. Проверяем health endpoint
    const health = await fetch('/health').then(r => r.json());

    // 2. Пробуем запрос без токена
    const testResponse = await fetch('/api/v1/memories?limit=1');

    if (testResponse.ok) {
      // Авторизация отключена
      setState(s => ({ ...s, authMode: 'disabled', isAuthenticated: true }));
      return;
    }

    if (testResponse.status === 401) {
      // Авторизация включена - определяем тип
      const authHeader = testResponse.headers.get('WWW-Authenticate');
      // Парсим доступные провайдеры из ответа бэкенда
      setState(s => ({ ...s, authMode: 'oauth', oauthProviders: ['github', 'google'] }));
    }
  }

  async function login(provider?: string) {
    if (provider) {
      // OAuth flow - редирект на бэкенд
      window.location.href = `/oauth/authorize?provider=${provider}&redirect_uri=${window.location.origin}/auth/callback`;
    }
  }

  function logout() {
    localStorage.removeItem('forgetful_token');
    setState(s => ({ ...s, token: null, user: null, isAuthenticated: false }));
  }

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Страница логина

```typescript
// src/pages/Login.tsx
export function LoginPage() {
  const { authMode, oauthProviders, login, isLoading } = useAuth();

  if (authMode === 'disabled') {
    return <Navigate to="/" />;
  }

  return (
    <Container className="login-page">
      <Paper className="login-card">
        <Title>Войти в Forgetful</Title>

        {/* OAuth кнопки */}
        <Stack>
          {oauthProviders.includes('github') && (
            <Button
              leftSection={<IconBrandGithub />}
              onClick={() => login('github')}
            >
              Войти через GitHub
            </Button>
          )}

          {oauthProviders.includes('google') && (
            <Button
              leftSection={<IconBrandGoogle />}
              onClick={() => login('google')}
            >
              Войти через Google
            </Button>
          )}
        </Stack>

        {/* Для JWT режима - форма с токеном */}
        {authMode === 'jwt' && (
          <TokenInputForm />
        )}
      </Paper>
    </Container>
  );
}
```

### Callback страница для OAuth

```typescript
// src/pages/AuthCallback.tsx
export function AuthCallbackPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Получаем токен из URL после OAuth редиректа
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Показать ошибку
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      setToken(token);
      localStorage.setItem('forgetful_token', token);
      navigate('/');
    }
  }, []);

  return <LoadingOverlay visible />;
}
```

### Предупреждение "Авторизация отключена"

```typescript
// src/components/auth/AuthWarning.tsx
export function AuthWarning() {
  const { authMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (authMode !== 'disabled' || dismissed) {
    return null;
  }

  return (
    <Alert
      icon={<IconAlertTriangle />}
      color="yellow"
      title="Авторизация отключена"
      withCloseButton
      onClose={() => setDismissed(true)}
    >
      Сервер работает без авторизации. Все данные доступны без входа.
      Это может быть небезопасно в production окружении.
    </Alert>
  );
}
```

### Защита маршрутов

```typescript
// src/components/auth/AuthGuard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authMode } = useAuth();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  // Если auth отключена - пропускаем (с предупреждением)
  if (authMode === 'disabled') {
    return <>{children}</>;
  }

  // Если не авторизован - редирект на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### Роутинг с авторизацией

```typescript
// src/App.tsx
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Защищённые маршруты */}
          <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/memories" element={<Memories />} />
            {/* ... остальные маршруты */}
          </Route>
        </Routes>
      </Router>

      {/* Глобальное предупреждение об отключённой авторизации */}
      <AuthWarning />
    </AuthProvider>
  );
}
```

### API клиент с авторизацией

```typescript
// src/api/client.ts
class ApiClient {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('forgetful_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Токен невалиден - разлогиниваем
      localStorage.removeItem('forgetful_token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new AuthError('Unauthorized');
    }

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}
```

### Источники токена (приоритет)

1. **URL параметр `?token=xxx`** - для iframe embedding, OAuth callback
2. **localStorage `forgetful_token`** - постоянное хранение
3. **OAuth flow** - получение через редирект

---

## 5. API клиент

### Базовый клиент с TanStack Query

```typescript
// src/api/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 секунд
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) {
          return false; // Не повторяем при ошибках авторизации
        }
        return failureCount < 3;
      },
    },
  },
});

export const apiClient = new ApiClient({
  baseUrl: '/api/v1',
  getToken: () => localStorage.getItem('forgetful_token'),
});
```

### Пример хуков для запросов

```typescript
// src/hooks/queries/useMemories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Memory, MemoryCreate, MemoryUpdate } from '@/types/memory';

export const memoryKeys = {
  all: ['memories'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (filters: MemoryFilters) => [...memoryKeys.lists(), filters] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...memoryKeys.details(), id] as const,
};

export function useMemories(filters: MemoryFilters) {
  return useQuery({
    queryKey: memoryKeys.list(filters),
    queryFn: () => apiClient.get<MemoryListResponse>('/memories', { params: filters }),
  });
}

export function useMemory(id: number) {
  return useQuery({
    queryKey: memoryKeys.detail(id),
    queryFn: () => apiClient.get<Memory>(`/memories/${id}`),
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemoryCreate) => apiClient.post<Memory>('/memories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
    },
  });
}
```

---

## 6. Конфигурация темы (Glassmorphism)

> Полная палитра из ui-spec.yaml metadata.palette

```typescript
// src/styles/theme.ts
import { createTheme, MantineColorsTuple, CSSVariablesResolver } from '@mantine/core';

// Цветовые палитры для Mantine (10 оттенков)
const memoryPurple: MantineColorsTuple = [
  '#f5f0ff', '#e9deff', '#d4bcff', '#b894ff', '#a855f7', // [4] = purple-500
  '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#3b0764'
];

const entityAmber: MantineColorsTuple = [
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', // [4] = amber-500
  '#d97706', '#b45309', '#92400e', '#78350f', '#451a03'
];

const documentBlue: MantineColorsTuple = [
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', // [4] = blue-500
  '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'
];

const codeArtifactCyan: MantineColorsTuple = [
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#06b6d4', // [4] = cyan-500
  '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344'
];

const projectGreen: MantineColorsTuple = [
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e', // [4] = green-500
  '#16a34a', '#15803d', '#166534', '#14532d', '#052e16'
];

export const theme = createTheme({
  primaryColor: 'purple',
  colors: {
    purple: memoryPurple,
    amber: entityAmber,
    blue: documentBlue,
    cyan: codeArtifactCyan,
    green: projectGreen,
  },

  // Тёмная тема по умолчанию
  defaultColorScheme: 'dark',

  components: {
    Paper: {
      defaultProps: {
        // Эффект glassmorphism (surface-primary из ui-spec)
        style: {
          background: 'rgba(30, 41, 59, 0.8)', // bg-slate-900/80
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)', // border-subtle
        },
      },
    },
  },

  other: {
    // === Акцентные цвета по типам (из ui-spec palette) ===
    accentMemory: '#a855f7',      // purple-500
    accentEntity: '#f59e0b',      // amber-500
    accentDocument: '#3b82f6',    // blue-500
    accentCodeArtifact: '#06b6d4', // cyan-500
    accentProject: '#22c55e',      // green-500

    // === Поверхности (glassmorphism) ===
    surfacePrimary: 'rgba(30, 41, 59, 0.8)',    // bg-slate-900/80 + blur
    surfaceSecondary: 'rgba(51, 65, 85, 0.6)',  // bg-slate-800/60 + blur
    surfaceHover: 'rgba(71, 85, 105, 0.4)',     // bg-slate-700/40

    // === Текст ===
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textDimmed: 'rgba(255, 255, 255, 0.4)',

    // === Границы ===
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderHover: 'rgba(255, 255, 255, 0.1)',

    // === Importance градиенты ===
    importanceHigh: 'linear-gradient(135deg, #ef4444, #f97316)',  // 9-10
    importanceMedium: '#eab308',  // 7-8
    importanceLow: '#6b7280',     // <7

    // === Фон ===
    bgBase: '#020617',            // slate-950
    bgSidebar: 'rgba(15, 23, 42, 0.95)', // slate-900/95
    bgGraph: '#020617',           // slate-950 (pure)

    // === Интерактивные состояния ===
    glowSelected: '0 0 20px rgba(168, 85, 247, 0.4)', // accent с opacity
  },
});

// CSS переменные для использования в компонентах
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {},
  dark: {
    '--surface-primary': theme.other.surfacePrimary,
    '--surface-secondary': theme.other.surfaceSecondary,
    '--text-primary': theme.other.textPrimary,
    '--text-secondary': theme.other.textSecondary,
    '--border-subtle': theme.other.borderSubtle,
  },
});
```

### Маппинг типов на цвета

```typescript
// src/utils/colors.ts
import { theme } from '@/styles/theme';

// Тип данных -> акцентный цвет (для бейджей, узлов графа)
export const typeColors = {
  memory: theme.other.accentMemory,
  entity: theme.other.accentEntity,
  document: theme.other.accentDocument,
  code_artifact: theme.other.accentCodeArtifact,
  project: theme.other.accentProject,
} as const;

// Importance -> цвет/градиент
export function getImportanceColor(importance: number): string {
  if (importance >= 9) return theme.other.importanceHigh;
  if (importance >= 7) return theme.other.importanceMedium;
  return theme.other.importanceLow;
}
```

---

## 7. Интеграция с бэкендом Forgetful

### Архитектура деплоя

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌─────────────────┐      ┌──────────────────────────┐  │
│  │  forgetful-ui   │      │   forgetful-service      │  │
│  │    (nginx)      │      │      (FastMCP)           │  │
│  │                 │      │                          │  │
│  │  :80 ───────────┼──────┼─► :8020                  │  │
│  │  /api/* proxy   │      │   /api/v1/*              │  │
│  │  /health proxy  │      │   /health                │  │
│  │  /* static      │      │   /mcp (for AI tools)    │  │
│  └────────┬────────┘      └──────────────────────────┘  │
│           │                                              │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
    Внешний доступ: localhost:3000
    (или через reverse proxy для HTTPS)
```

### Переменные окружения

```bash
# .env.example для forgetful-ui
VITE_API_BASE_URL=/api/v1          # Базовый путь API (проксируется)
VITE_APP_TITLE=Forgetful           # Заголовок приложения
VITE_AUTH_ENABLED=false            # Показывать/скрывать UI авторизации
```

```bash
# Дополнительные переменные для docker-compose.yml
UI_IMAGE_TAG=latest                # Тег Docker образа UI
UI_PORT=3000                       # Внешний порт UI
UI_BIND_ADDRESS=127.0.0.1          # Адрес привязки
```

---

## 8. TypeScript типы (из data-spec.yaml)

> Все типы генерируются на основе data-spec.yaml entities и enums

### Enums

```typescript
// src/types/enums.ts

// Из data-spec.yaml enums.entity_type
export type EntityType = 'Organization' | 'Individual' | 'Team' | 'Device' | 'Other';

// Из data-spec.yaml enums.project_type
export type ProjectType =
  | 'personal' | 'work' | 'learning' | 'development'
  | 'infrastructure' | 'template' | 'product' | 'marketing'
  | 'finance' | 'documentation' | 'development-environment'
  | 'third-party-library' | 'open-source';

// Из data-spec.yaml enums.project_status
export type ProjectStatus = 'active' | 'archived' | 'completed';
```

### Entity Types

```typescript
// src/types/memory.ts
export interface Memory {
  id: number;
  title: string;
  content: string;
  context: string;
  keywords: string[];      // json array
  tags: string[];          // json array
  importance: number;      // 1-10, default 7
  is_obsolete: boolean;
  obsolete_reason?: string;
  superseded_by?: number;  // FK to Memory
  obsoleted_at?: string;   // ISO datetime
  created_at: string;
  updated_at: string;
}

// src/types/entity.ts
export interface Entity {
  id: number;
  name: string;
  entity_type: EntityType;
  custom_type?: string;    // required when entity_type is 'Other'
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// src/types/entity-relationship.ts
export interface EntityRelationship {
  id: number;
  source_entity_id: number;
  target_entity_id: number;
  relationship_type: string;  // 'works_at', 'owns', 'manages', 'part_of', 'reports_to'
  strength?: number;          // 0.0-1.0
  confidence?: number;        // 0.0-1.0
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// src/types/project.ts
export interface Project {
  id: number;
  name: string;
  description: string;
  project_type: ProjectType;
  status: ProjectStatus;
  repo_name?: string;         // 'owner/repo' format
  notes?: string;
  memory_count: number;       // computed
  created_at: string;
  updated_at: string;
}

// src/types/document.ts
export interface Document {
  id: number;
  title: string;
  description: string;
  content: string;
  document_type: string;      // 'markdown', 'text', 'report', 'notes'
  filename?: string;
  size_bytes?: number;        // auto-calculated
  tags: string[];
  project_id?: number;
  created_at: string;
  updated_at: string;
}

// src/types/code-artifact.ts
export interface CodeArtifact {
  id: number;
  title: string;
  description: string;
  code: string;
  language: string;           // 'python', 'typescript', etc.
  tags: string[];
  project_id?: number;
  created_at: string;
  updated_at: string;
}
```

### Graph Types (для визуализации)

```typescript
// src/types/graph.ts

// Типы узлов для графа (все сущности + relations)
export type NodeType = 'memory' | 'entity' | 'project' | 'document' | 'code_artifact';

export interface GraphNode {
  id: string;                 // Формат: "memory_1", "entity_5", etc.
  type: NodeType;
  label: string;              // title или name
  importance?: number;        // для размера узла (memories)
  data: Memory | Entity | Project | Document | CodeArtifact;
}

export interface GraphEdge {
  id: string;
  source: string;             // node id
  target: string;             // node id
  type: string;               // relationship_type или relation label
  strength?: number;          // для толщины линии
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### Create/Update DTOs

```typescript
// src/types/memory.ts (продолжение)
export interface MemoryCreate {
  title: string;
  content: string;
  context: string;
  keywords?: string[];
  tags?: string[];
  importance?: number;
  project_ids?: number[];     // связь many-to-many
}

export interface MemoryUpdate extends Partial<MemoryCreate> {
  is_obsolete?: boolean;
  obsolete_reason?: string;
  superseded_by?: number;
}
```

---

## 9. Фазы реализации

### Фаза 1: Фундамент
1. Создать проект Vite + React + TypeScript
2. Настроить Mantine с тёмной glassmorphism темой
3. Настроить React Router с основным layout
4. Создать Docker + nginx конфигурацию
5. Реализовать API клиент с token pass-through auth

### Фаза 2: Основной функционал
1. Страница Dashboard со статистикой
2. Список memories + страница деталей
3. Компонент quick edit drawer
4. Базовые CRUD операции

### Фаза 3: Полное управление данными
1. Страницы Entities, Projects, Documents, Code Artifacts
2. Inline редактирование в таблицах
3. Массовые операции
4. Функционал поиска

### Фаза 4: Визуализация графа
1. Интеграция react-force-graph-2d
2. Фильтрация и стилизация узлов
3. Интерактивные контролы
4. Легенда и minimap

### Фаза 5: Полировка и релиз
1. Горячие клавиши (Ctrl+K поиск)
2. Обработка ошибок и состояния загрузки
3. CI/CD pipeline
4. Документация
5. Тег v0.1.0

---

## Критические файлы для создания

### Инфраструктура

| Файл | Назначение |
|------|------------|
| `vite.config.ts` | Dev proxy на localhost:8020, конфиг сборки |
| `docker/Dockerfile` | Multi-stage сборка (node → nginx) |
| `docker/nginx.conf` | SPA routing + API proxy |
| `docker/docker-compose.yml` | Полный стек (бэкенд + UI) |
| `docker/docker-compose.dev.yml` | Только бэкенд для dev |
| `.env.example` | Пример переменных окружения |

### Авторизация

| Файл | Назначение |
|------|------------|
| `src/context/AuthContext.tsx` | Глобальный контекст, определение режима auth |
| `src/pages/Login.tsx` | Страница логина с OAuth кнопками |
| `src/pages/AuthCallback.tsx` | Обработка OAuth redirect |
| `src/components/auth/AuthGuard.tsx` | Защита маршрутов |
| `src/components/auth/AuthWarning.tsx` | Предупреждение "auth disabled" |
| `src/components/auth/UserMenu.tsx` | Меню пользователя в header |
| `src/hooks/useAuth.ts` | Хук для работы с auth |

### API и данные

| Файл | Назначение |
|------|------------|
| `src/api/client.ts` | Базовый API клиент с Bearer token |
| `src/api/memories.ts` | API для memories |
| `src/api/entities.ts` | API для entities |
| `src/api/entity-relationships.ts` | API для связей между entities |
| `src/api/search.ts` | Unified search API |
| `src/hooks/queries/useMemories.ts` | TanStack Query хуки |

### TypeScript типы (из data-spec.yaml)

| Файл | Назначение |
|------|------------|
| `src/types/enums.ts` | EntityType, ProjectType, ProjectStatus |
| `src/types/memory.ts` | Memory + MemoryCreate/Update |
| `src/types/entity.ts` | Entity интерфейс |
| `src/types/entity-relationship.ts` | EntityRelationship интерфейс |
| `src/types/project.ts` | Project интерфейс |
| `src/types/document.ts` | Document интерфейс |
| `src/types/code-artifact.ts` | CodeArtifact интерфейс |
| `src/types/graph.ts` | GraphNode, GraphEdge, GraphData |

### UI компоненты (из ui-spec.yaml)

| Файл | Назначение |
|------|------------|
| `src/styles/theme.ts` | Mantine тема с полной palette из ui-spec |
| `src/utils/colors.ts` | Маппинг типов на цвета |
| `src/components/layout/MainLayout.tsx` | Трёхколоночный layout (main_layout template) |
| `src/components/layout/Sidebar.tsx` | Collapsible sidebar с навигацией |
| `src/components/layout/DetailPanel.tsx` | Quick edit slide-in панель |
| `src/components/layout/GlobalSearch.tsx` | Поиск в sidebar (Ctrl+K) |
| `src/components/common/TypeBadge.tsx` | Цветной бейдж по типу сущности |
| `src/components/common/ImportanceBadge.tsx` | Индикатор importance (1-10) |
| `src/components/common/BulkActionsBar.tsx` | Sticky bar для массовых операций |

### Graph компоненты (из ui-spec graph screen)

| Файл | Назначение |
|------|------------|
| `src/components/graph/GraphCanvas.tsx` | react-force-graph-2d wrapper |
| `src/components/graph/GraphToolbar.tsx` | Floating controls (zoom, layout, filters) |
| `src/components/graph/GraphLegend.tsx` | Node types legend (bottom-left) |
| `src/components/graph/GraphMinimap.tsx` | Viewport minimap (bottom-right) |
| `src/components/graph/GraphEmptyState.tsx` | Empty state illustration |

### Модальные окна (из ui-spec overlays)

| Файл | Назначение |
|------|------------|
| `src/components/modals/ItemEditor.tsx` | Create/edit modal (item_editor screen) |
| `src/components/modals/SearchResults.tsx` | Search overlay (search_results screen) |
| `src/components/modals/ConfirmDialog.tsx` | Delete confirmation |

---

## Принятые решения

| Вопрос | Решение |
|--------|---------|
| Авторизация | Полная поддержка всех вариантов (disabled, JWT, OAuth) с первой версии |
| docker-compose | Храним в репо forgetful-ui (нет прав на бэкенд) |
| Auth disabled | Показываем жёлтое предупреждение о небезопасности |
