---
name: local-dev
description: Bring up or run the Focus Trail local dev environment (Docker Postgres, Prisma migrations, dev servers). Use when setting up local dev, resetting the local database, or creating a test user.
---

# Local development

Prereqs: Docker Desktop running; `backend/.env` present (copy from `backend/.env.example`).

## One command

- `npm run dev:up` — resets the local DB container (**drops local data**), starts Postgres, applies migrations, generates the Prisma client, then runs backend + frontend together.
- `npm run dev:db` — only the data layer (reset container + migrate + generate). Then `npm run dev` runs both servers.

Under the hood (`scripts/dev-up.mjs`): `docker compose down -v` + `docker compose up -d --wait db` (run inside `backend/`), then `prisma migrate deploy` + `prisma generate`. Postgres credentials come from `backend/.env` (`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`, kept consistent with `DATABASE_URL`). The script has no secrets — safe to version.

## Create a test user

With the app running, open http://localhost:5173 and use the **Cadastrar** form. Locally, email is disabled (no `RESEND_API_KEY`), so registration logs you in directly — no verification step.

## Notes

- Frontend dev proxies `/api` → `http://localhost:3001` (Vite proxy); the backend must be running for login/data.
- Backend tests do NOT load `.env` (`env.ts` skips it when `NODE_ENV=test`); they use the values in `vitest*.config.ts`.
