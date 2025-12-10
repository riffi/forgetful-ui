# UI Spec & Data Spec — Getting Started для AI агентов

Краткое руководство для AI агентов по использованию форматов UI Spec и Data Spec в проектах.

---

## Что это за спеки

**UI Spec** — формат описания пользовательского интерфейса:
- Экраны, блоки, темы
- Progressive Precision: от минимальной спеки до implementation-ready
- Поле `purpose` — ключевое: описывает ЧТО отображается И КАК ведёт себя (клики, ховеры, переходы)

**Data Spec** — формат описания логических моделей данных:
- Сущности, поля, типы, связи
- Логическая модель, не физическая БД
- Enums, relations, validation rules

**Ключевые принципы:**
- Self-describing: AI понимает форматы нативно без инструкций
- Purpose > Everything: описывай намерение, не реализацию
- Format > Tool: форматы работают в любом текстовом редакторе

---

## Форматы (ссылки)

Официальные спецификации форматов:

- **UI Spec:** https://app.speccanvas.dev/formats/ui-spec-format-0-0-2.yaml
- **Data Spec:** https://app.speccanvas.dev/formats/data-spec-format-0-0-1.yaml

---

## Reverse Engineering: как делать спеки из кода

### UI Spec из кода

1. **Анализируй структуру** — определи экраны и логические блоки (не HTML элементы!)
2. **Извлекай намерения** — что делает каждый блок, какие действия, какие данные
3. **Опиши в YAML** — фокус на `purpose`, не на реализации

```yaml
# Пример: из React компонента → UI Spec
screens:
  dashboard:
    title: Dashboard
    purpose: "Overview of user's tasks and productivity metrics"
    blocks:
      - id: stats
        purpose: "Statistics cards: total tasks, completed today, overdue. Click navigates to filtered list"
      - id: task_list
        purpose: "Task list with checkboxes (toggle completes task), due dates. Click opens task detail"
```

### Data Spec из кода/БД

1. **Определи сущности** — основные бизнес-объекты
2. **Извлеки поля** — типы, ограничения, связи
3. **Опиши связи** — one_to_one, one_to_many, many_to_many

```yaml
# Пример: из Prisma/TypeORM → Data Spec
entities:
  task:
    description: "User task with status and deadline"
    fields:
      id:
        type: uuid
        pk: true
      title:
        type: string
        required: true
      status:
        type: task_status
      due_date:
        type: datetime

enums:
  task_status:
    values: [todo, in_progress, done]
```

### Что НЕ включать

- HTML теги, CSS классы, селекторы
- Детали реализации (useState, useEffect, handlers)
- Физические детали БД (индексы, триггеры)

---

## Где хранить спеки

Рекомендуемая структура:

```
/docs/spec/
  ui-spec.yaml          # UI спецификация проекта
  data-spec.yaml        # Data спецификация проекта
  ui-spec-format.yaml   # Копия формата для референса (опционально)
  data-spec-format.yaml # Копия формата для референса (опционально)
```

---

## Минимальный пример

### UI Spec

```yaml
docType: ui-spec
format_version: "0.0.2"

metadata:
  name: task-manager
  description: "Task management application for personal productivity"
  theme: "modern minimal with soft shadows"

screens:
  home:
    title: Home
    purpose: "Main dashboard with task overview and quick actions"
    blocks:
      - id: header
        purpose: "Header with app title and user menu. Menu click opens dropdown with settings/logout"
      - id: stats
        columns: 12
        purpose: "Statistics cards showing task counts by status. Hover highlights, click filters task_list"
      - id: task_list
        columns: 8
        purpose: "Active tasks list with checkboxes and due dates. Checkbox toggles done, row click opens editor"
      - id: quick_add
        columns: 4
        purpose: "Quick add form: title input + submit button. Enter or click adds task to list"
```

### Data Spec

```yaml
docType: data-spec
format_version: "0.0.1"

metadata:
  name: task-manager
  description_short: "Task management data model"

entities:
  task:
    label: Task
    description: "A task with title, status, and optional deadline"
    fields:
      id:
        type: uuid
        pk: true
      title:
        type: string
        required: true
      status:
        type: task_status
        default: todo
      due_date:
        type: datetime

enums:
  task_status:
    values: [todo, in_progress, done]
    description: "Task completion status"
```

