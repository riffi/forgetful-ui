# FastMCP OAuth Performance Issue

## Проблема

При включённой GitHub OAuth авторизации каждый API запрос занимает **2+ секунды** вместо ~50ms.

## Диагностика

### Симптомы
- Browser DevTools → Network → Timing показывает:
  - **Waiting for server response (TTFB): 2.16s**
  - Остальные метрики (DNS, Connection, Download) в норме

### Конфигурация
```env
# .env.local
FASTMCP_SERVER_AUTH=fastmcp.server.auth.providers.github.GitHubProvider
FASTMCP_SERVER_AUTH_GITHUB_CLIENT_ID=Ov23li...
FASTMCP_SERVER_AUTH_GITHUB_CLIENT_SECRET=...
FASTMCP_SERVER_AUTH_GITHUB_BASE_URL=http://localhost:3000
```

## Причина

### Архитектура валидации токена в FastMCP

```
Request с Bearer token
    │
    ▼
OAuthProxy.verify_token()
    │
    ▼
OAuthProxy.load_access_token()
    │
    ├── 1. Verify FastMCP JWT signature (локально, быстро) ✅
    │
    ├── 2. Lookup upstream token via JTI (disk/memory, быстро) ✅
    │
    └── 3. Validate upstream token with GitHubTokenVerifier ❌ ПРОБЛЕМА
            │
            ▼
        GitHubTokenVerifier.verify_token()
            │
            ├── HTTP GET https://api.github.com/user (~1s)
            │
            └── HTTP GET https://api.github.com/user/repos (~1s)
                    │
                    ▼
                Total: ~2 секунды на КАЖДЫЙ запрос
```

### Исходный код проблемы

**Файл:** `fastmcp/server/auth/oauth_proxy.py`

```python
async def load_access_token(self, token: str) -> AccessToken | None:
    # ...
    # Шаг 3: ВСЕГДА валидирует upstream token через GitHub API!
    validated = await self._token_validator.verify_token(
        upstream_token_set.access_token
    )
    # ...
```

**Файл:** `fastmcp/server/auth/providers/github.py`

```python
class GitHubTokenVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> AccessToken | None:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            # Запрос 1: Получить user info
            response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token}", ...},
            )
            # ...

            # Запрос 2: Получить OAuth scopes
            scopes_response = await client.get(
                "https://api.github.com/user/repos",
                headers={"Authorization": f"Bearer {token}", ...},
            )
            # ...
```

### Ключевая проблема

**В FastMCP OAuthProxy НЕТ кэширования результата валидации upstream токена.**

Даже если:
- FastMCP JWT подпись уже проверена (доказывает, что токен выдан этим сервером)
- Upstream токен найден в хранилище
- Токен использовался 5 секунд назад

...всё равно делается 2 HTTP запроса к GitHub API.

## Версия FastMCP

```
fastmcp>=2.13.1  # из pyproject.toml
```

## Решения

### 1. Отключить auth для локальной разработки (workaround)

```env
# Закомментировать в .env.local:
# FASTMCP_SERVER_AUTH=...
```

### 2. Добавить кэширование в forgetful middleware

Создать middleware который кэширует результат `get_user_from_request()` на N минут по токену.

### 3. Создать PR в FastMCP

Добавить параметр `upstream_token_cache_ttl` в `OAuthProxy`:

```python
class OAuthProxy:
    def __init__(
        self,
        # ...
        upstream_token_cache_ttl: int = 0,  # секунды, 0 = disabled
    ):
        self._token_cache: dict[str, tuple[AccessToken, float]] = {}
        self._cache_ttl = upstream_token_cache_ttl

    async def load_access_token(self, token: str) -> AccessToken | None:
        # Check cache first
        if self._cache_ttl > 0:
            cached = self._token_cache.get(token)
            if cached and (time.time() - cached[1]) < self._cache_ttl:
                return cached[0]

        # ... existing validation logic ...

        # Cache result
        if self._cache_ttl > 0 and validated:
            self._token_cache[token] = (validated, time.time())

        return validated
```

## Ссылки

- FastMCP GitHub: https://github.com/jlowin/fastmcp
- GitHub OAuth API rate limits: https://docs.github.com/en/rest/rate-limit
