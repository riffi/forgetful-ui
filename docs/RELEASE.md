# Как выложить новый релиз forgetful-ui

## Подготовка (один раз)

### 1. Создай GitHub Token

1. Открой https://github.com/settings/tokens
2. Нажми "Generate new token (classic)"
3. Выбери scope: `write:packages`
4. Скопируй токен (он покажется только один раз!)

### 2. Авторизуйся в Docker Registry

```bash
echo ТВОЙ_ТОКЕН | docker login ghcr.io -u riffi --password-stdin
```

Если успешно - увидишь `Login Succeeded`

---

## Выкладка релиза (каждый раз)

### Шаг 1: Убедись что Docker Desktop запущен

Просто открой Docker Desktop. Должен работать.

### Шаг 2: Перейди в папку проекта

```bash
cd C:\work\forgetful-prj\forgetful-ui
```

### Шаг 3: Собери и запуши

```bash
npm run release
```

Это выполнит:
- `npm run build` - соберёт фронтенд
- `npm run docker:build` - соберёт Docker образ
- `npm run docker:tag` - пометит тегом для ghcr.io
- `npm run docker:push` - запушит в registry

### Шаг 4: Готово!

Образ доступен по адресу:
```
ghcr.io/riffi/forgetful-ui:latest
```

---

## Если что-то пошло не так

### "denied: permission denied"
Повтори авторизацию (Шаг 2 из подготовки)

### "Cannot connect to Docker daemon"
Запусти Docker Desktop

### Build failed
Сначала проверь что локально собирается:
```bash
npm run build
```

---

## Команды по отдельности (если нужно)

| Что сделать | Команда |
|-------------|---------|
| Только собрать фронт | `npm run build` |
| Только собрать Docker образ | `npm run docker:build` |
| Только запушить | `npm run docker:push` |
| Всё сразу | `npm run release` |

---

## Обновление на сервере (после публикации)

После того как `npm run release` успешно завершился, нужно обновить прод.

### Шаг 1: Подключись к серверу

```bash
ssh твой-сервер
```

### Шаг 2: Перейди в папку с docker-compose

```bash
cd /путь/к/forgetful-ui/docker
```

### Шаг 3: Скачай новый образ

```bash
docker compose pull forgetful-ui
```

### Шаг 4: Перезапусти контейнер

```bash
docker compose up -d forgetful-ui
```

### Шаг 5: Проверь что работает

```bash
docker compose ps
docker compose logs -f forgetful-ui --tail 20
```

Должен показать статус `Up` и nginx логи.

---

## Быстрая версия (копипаста для сервера)

```bash
cd /путь/к/forgetful-ui/docker && docker compose pull forgetful-ui && docker compose up -d forgetful-ui
```

---

## Откат на предыдущую версию

Если что-то сломалось:

```bash
# Посмотри какие образы есть
docker images ghcr.io/riffi/forgetful-ui

# Откати на конкретную версию (если есть теги)
docker compose down forgetful-ui
docker compose up -d forgetful-ui
```
