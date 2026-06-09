# AuditRank — Backend

REST API на **Node.js + Express + TypeScript** (ESM).

## Запуск

Нужен запущенный **PostgreSQL** и созданная база (по умолчанию `auditrank`):

```bash
createdb auditrank     # или через pgAdmin: Databases → Create → Database

npm install
cp .env.example .env   # пропишите DATABASE_URL под свой Postgres
npm run dev            # режим разработки с авто-перезапуском (tsx watch)
```

Таблица `orgs` создаётся автоматически при первом старте (`initDb`).

Production:

```bash
npm run build          # компиляция в dist/
npm start              # node dist/index.js
```

## Переменные окружения

| Переменная     | По умолчанию              | Назначение                          |
| -------------- | ------------------------- | ----------------------------------- |
| `PORT`         | `4000`                    | Порт HTTP-сервера                   |
| `CORS_ORIGIN`  | `*`                       | Разрешённый источник CORS (фронт)   |
| `NODE_ENV`     | `development`             | Окружение                           |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/auditrank` | Подключение к PostgreSQL |

## Архитектура

Слоистая структура — каждый слой не знает о деталях соседнего:

```
src/
├── index.ts              # точка входа: запуск сервера
├── app.ts                # сборка Express-приложения и middleware
├── config/env.ts         # конфигурация из переменных окружения
├── routes/               # маршруты (HTTP → контроллеры)
├── controllers/          # разбор запроса/ответа, валидация
├── services/             # бизнес-логика (без знания об HTTP)
├── data/                 # хранилище: пул PostgreSQL + таблица orgs (JSONB баллы)
├── middleware/           # обработка ошибок и 404
└── types/                # доменные типы (контракт с фронтендом)
```

## Эндпоинты

Базовый префикс — `/api`.

| Метод    | Путь            | Описание                       |
| -------- | --------------- | ------------------------------ |
| `GET`    | `/api/health`   | Проверка работоспособности     |
| `GET`    | `/api/orgs`     | Список организаций             |
| `POST`   | `/api/orgs`     | Создать организацию            |
| `GET`    | `/api/orgs/:id` | Получить организацию по id     |
| `PUT`    | `/api/orgs/:id` | Обновить организацию           |
| `DELETE` | `/api/orgs/:id` | Удалить организацию            |

> Данные хранятся в **PostgreSQL** (таблица `orgs`, баллы — в колонке `k_scores`
> типа JSONB) и переживают перезапуск сервера.
