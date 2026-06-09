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

## Деплой на Vercel

Корневой [vercel.json](vercel.json) настроен на сборку **фронтенда** из подпапки
`frontend/` без изменения настроек проекта в дашборде Vercel:

- `installCommand` / `buildCommand` выполняются с `--prefix frontend`;
- результат берётся из `frontend/dist`;
- SPA-маршруты разрешаются через `rewrites` на `/index.html`.

Бэкенд деплоится отдельно (например, как самостоятельный сервис на Render/Railway
или как serverless-функции) — фронтенд от этого не зависит.
