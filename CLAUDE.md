# Focus Trail — coding conventions

Binding rules for every code change in this repository.

## Language

- Source code is written in **English**: identifiers (variables, functions, types,
  file names) and test titles (`describe` / `it`).
- **User-facing copy stays in Portuguese (pt-BR)**: JSX text, toast messages,
  validation and error messages shown to the user, `aria-label`s, placeholders.
- Docs and commit messages in Portuguese are fine.

## Comments

- **No comments.** The code must explain itself through naming and structure.
- Keep only strictly necessary, functional ones: `eslint-disable*`,
  `@ts-expect-error` / `@ts-ignore`, `/// <reference ... />`, shebangs, and
  license / SPDX headers.

## Naming

- Prefer **semantic, intention-revealing names** that read like prose. Favor
  clarity over brevity; avoid abbreviations and single letters (except
  conventional short-lived loop indices).

## Tests

- **Every feature (frontend or backend) ships with unit tests.**
- Keep coverage gates green: backend unit ≥ 85%; frontend logic (hooks, lib,
  providers, feature components) ≥ 85%.
- A change is only done when typecheck, tests, and build all pass.

## Stack

- Frontend: React + Vite + TypeScript, styled with Tailwind v4
  (`frontend/src/styles/global.css` is the single stylesheet).
- Backend: Fastify + Prisma + TypeScript, layered route → controller → service →
  repository.
