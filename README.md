# Focus Trail

![Languages used](https://img.shields.io/github/languages/count/isadfrn/focus-trail?style=flat-square)
![Repository size](https://img.shields.io/github/repo-size/isadfrn/focus-trail?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/isadfrn/focus-trail?style=flat-square)
![License](https://img.shields.io/github/license/isadfrn/focus-trail?style=flat-square)
![Coverage](https://img.shields.io/badge/coverage-95.03%25-brightgreen?style=flat-square)

## About

**Focus Trail** is a Pomodoro focus timer with an animated, retro pixel-art scene: while the timer runs, a character walks across a scrolling background and terrain. When you pause, the scene pauses with it.

## Features

- Pomodoro timer with a walking character and parallax background/terrain that animate only while running.
- Data-driven scenarios ([`frontend/src/assets/scenarios.json`](frontend/src/assets/scenarios.json)): character sprite sheets are **auto-sliced into frames at runtime**, and each scene exposes per-scenario tuning (terrain height, character baseline, camera/terrain/sprite speed).
- Scenario picker in the app menu (locked while a session is running).
- Email/password auth with cookie-based JWT sessions and server-side session revocation.
- Session history per user.
- Backend startup check that fails fast with an actionable message when the database is unreachable or unmigrated.

## Screenshots

![Login screen](docs/screenshots/timer.png)

## Tech Stack

**Frontend**

- React 18 + TypeScript, built with Vite 6
- Tailwind CSS 4, Radix UI primitives
- React Router 6

**Backend**

- Fastify 5 + TypeScript (run with `tsx`)
- Prisma 6 ORM + PostgreSQL 16
- `@fastify/jwt` (cookie sessions), `@node-rs/argon2` (password hashing), `zod` (validation)
- `@fastify/swagger` (OpenAPI docs), `@fastify/rate-limit`, `@fastify/cors`, `@fastify/cookie`
- Vitest, ESLint, Prettier

**Tooling**

- Node 24.20.0 (`.nvmrc`)
- Conventional Commits enforced by commitlint + Husky
- Changelog and releases via [changelogen](https://github.com/unjs/changelogen)

## Project Structure

```
focus-trail/
├── backend/        Fastify + Prisma API (auth, sessions, /me, health, Swagger)
│   ├── prisma/     schema + migrations
│   ├── src/        controllers, services, repositories, routes, schemas, lib
│   ├── bruno/      HTTP request collection (Bruno)
│   └── docker-compose.yml
├── frontend/       Vite + React app
│   └── src/assets/ scenario pools (background/, character/, terrain/) + scenarios.json
├── CHANGELOG.md
└── package.json    root tooling (Husky, commitlint, changelogen)
```

## Requirements

- Node `24.20.0` (nvm recommended)
- Docker and Docker Compose (for PostgreSQL) — or a local PostgreSQL 16
- npm

## Getting Started

Clone the repository and select the Node version:

```bash
git clone git@github.com:isadfrn/focus-trail.git
cd focus-trail
nvm use
npm install
```

The root `npm install` sets up the shared tooling (Husky hooks, commitlint, changelogen). The frontend and backend have their own dependencies.

### Backend

```bash
cd backend
npm install
cp .env.example .env
docker compose up -d
npm run prisma:migrate
npm run dev
```

> `JWT_SECRET` must be at least 32 characters and not a known placeholder. Generate one with `openssl rand -base64 48`.
> With `NODE_ENV=development` (or `ENABLE_SWAGGER=true`), Swagger UI is served at `http://localhost:3001/docs`.
> To run the API in Docker too, use the `full` profile: `docker compose --profile full up -d`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:3001`, so start the backend first.

## Environment Variables (backend `.env`)

| Variable          | Description                                         | Example                                                           |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string                        | `postgresql://focus:pass@127.0.0.1:5432/focustrail?schema=public` |
| `PORT`            | API port                                            | `3001`                                                            |
| `HOST`            | Bind host                                           | `127.0.0.1`                                                       |
| `NODE_ENV`        | `development` \| `production` \| `test`             | `development`                                                     |
| `JWT_SECRET`      | Session signing secret (≥ 32 chars, no placeholder) | output of `openssl rand -base64 48`                               |
| `CORS_ORIGIN`     | Allowed frontend origin                             | `http://localhost:5173`                                           |
| `SESSION_MAX_AGE` | Session lifetime in seconds                         | `604800`                                                          |
| `ENABLE_SWAGGER`  | Serve Swagger UI outside development                | `false`                                                           |

`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are consumed by `docker-compose.yml` to provision the database.

## API

Base path: `/api`

| Method | Route            | Auth    | Description                    |
| ------ | ---------------- | ------- | ------------------------------ |
| `GET`  | `/health`        | public  | Health check                   |
| `POST` | `/auth/register` | public  | Create an account              |
| `POST` | `/auth/login`    | public  | Sign in (sets session cookie)  |
| `POST` | `/auth/logout`   | session | Sign out (revokes the session) |
| `GET`  | `/me`            | session | Current user                   |
| `POST` | `/sessions`      | session | Record a Pomodoro session      |
| `GET`  | `/sessions`      | session | List the user's sessions       |

An HTTP request collection is available in [`backend/bruno`](backend/bruno).

## Scenes

Every scene is one entry in [`frontend/src/assets/scenarios.json`](frontend/src/assets/scenarios.json). Assets live in shared pools under `frontend/src/assets/{background,character,terrain}/`.

To add a scenario: drop the images in the pools and add a block referencing them by filename.

```json
{
  "id": "diddy",
  "name": "Diddy Kong",
  "skyColor": "#123a2a",
  "background": "forest-background.png",
  "terrain": "forest-ground.png",
  "sheet": "diddy.png"
}
```

The character `sheet` is a single sprite sheet whose frames are detected automatically (one frame = idle, two or more = walk animation). Optional per-scenario knobs: `frames`, `height`, `terrainHeight`, `baseline`, `cameraSpeed`, `terrainSpeed`, `spriteSpeed`.

## Scripts

**Backend** (`backend/`)

| Script                   | Purpose                       |
| ------------------------ | ----------------------------- |
| `npm run dev`            | API in watch mode             |
| `npm start`              | run the API once              |
| `npm run typecheck`      | type-check                    |
| `npm test`               | unit tests (Vitest)           |
| `npm run test:coverage`  | tests with coverage           |
| `npm run lint`           | ESLint                        |
| `npm run prisma:migrate` | create/apply migrations (dev) |
| `npm run prisma:studio`  | open Prisma Studio            |

**Frontend** (`frontend/`)

| Script              | Purpose                       |
| ------------------- | ----------------------------- |
| `npm run dev`       | Vite dev server               |
| `npm run build`     | type-check + production build |
| `npm run preview`   | preview the build             |
| `npm run typecheck` | type-check                    |

**Root**

| Script                                    | Purpose                                        |
| ----------------------------------------- | ---------------------------------------------- |
| `npm run changelog`                       | regenerate `CHANGELOG.md` from commits         |
| `npm run release`                         | bump version, update changelog, commit and tag |
| `npm run release:minor` / `release:major` | force the bump type                            |

## Versioning

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (validated by commitlint). Releases and the changelog are generated from those commits with `npm run release`.

## License

[MIT](./LICENSE)
