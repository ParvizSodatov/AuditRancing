# AuditRank

Рейтинг аудиторских организаций. Проект организован как монорепозиторий из двух
независимых приложений:

```
AuditRank/
├── frontend/   # SPA на Vite + React + TypeScript (текущий UI)
├── backend/    # REST API на Node.js + Express + TypeScript
└── vercel.json # деплой фронтенда на Vercel
```

## Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в frontend/dist
```

Подробнее — [frontend/README.md](frontend/README.md).

## Backend

```bash
cd backend
npm install
npm run dev      # http://localhost:4000
npm run build    # компиляция в backend/dist
npm start        # запуск собранной версии
```

Подробнее — [backend/README.md](backend/README.md).

## Деплой (глобально)

Приложение состоит из трёх частей: **фронтенд** (Vercel), **бэкенд** (Render) и
**база данных** PostgreSQL (managed-база Render). Порядок настройки:

### 1. Бэкенд + база — Render

Корневой [render.yaml](render.yaml) уже описывает веб-сервис и базу PostgreSQL.

1. Render → **New → Blueprint** → подключить этот репозиторий.
2. Render создаст сервис `auditrank-api` и базу `auditrank-db`, сам подставит
   `DATABASE_URL`. Таблица `orgs` создаётся при первом запуске автоматически.
3. После деплоя получите адрес вида `https://auditrank-api.onrender.com`.

### 2. Фронтенд — Vercel

Корневой [vercel.json](vercel.json) собирает **фронтенд** из подпапки `frontend/`:
`buildCommand` с `--prefix frontend`, результат из `frontend/dist`, SPA-маршруты
через `rewrites` на `/index.html`.

В настройках проекта Vercel задайте переменную окружения:

```
VITE_API_URL = https://auditrank-api.onrender.com/api
```

(адрес бэка с шага 1, см. [frontend/.env.example](frontend/.env.example)).

### 3. Связать CORS

В дашборде Render у сервиса `auditrank-api` задайте переменную:

```
CORS_ORIGIN = https://ваш-проект.vercel.app
```

(адрес фронта с шага 2). Иначе браузер заблокирует запросы между доменами.

```
[Браузер] → Vercel (фронт) → Render (бэк /api) → PostgreSQL (Render)
```

> Альтернатива базе: бесплатный Postgres на [Neon](https://neon.tech) — тогда
> вместо базы из `render.yaml` пропишите её `DATABASE_URL` вручную в сервисе Render.
> SSL включается автоматически для любой нелокальной базы.
