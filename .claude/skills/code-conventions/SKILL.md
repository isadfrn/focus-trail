---
name: code-conventions
description: Coding conventions for the Focus Trail repository. Use whenever writing or editing any source code or tests here (naming, language, comments, tests, stack).
---

# Code conventions

- **Language**: all source code is **English** — identifiers (variables, functions, types, file names) and test titles (`describe`/`it`). **User-facing copy stays Portuguese (pt-BR)**: JSX text, toasts, validation/error messages shown to the user, `aria-label`s, placeholders. Dev/operational strings (console logs, thrown `Error` messages, startup logs) are English.
- **No comments**: the code must explain itself through naming and structure. Keep only strictly necessary functional ones: `eslint-disable*`, `@ts-expect-error` / `@ts-ignore`, `/// <reference ... />`, shebangs, and license/SPDX headers.
- **Naming**: semantic, intention-revealing names that read like prose; avoid abbreviations and single letters (except short-lived loop indices).
- **Tests**: every feature (frontend or backend) ships with unit tests. Keep coverage gates green — backend unit ≥ 85% (`backend/vitest.config.ts`), frontend logic ≥ 85% (`frontend/vitest.config.ts`, scoped to hooks/lib/providers/api/feature components). A change is done only when typecheck, tests, and build pass.

## Stack

- Frontend: React + Vite + TypeScript, styled with Tailwind v4 (`frontend/src/styles/global.css` is the single stylesheet).
- Backend: Fastify + Prisma + TypeScript, layered route → controller → service → repository.

## Removing comments in bulk

Never strip comments with naive regex (it corrupts strings, regex literals, and JSX). Use a TypeScript-scanner-based pass and preserve the functional directives listed above.
