---
name: release
description: Cut a release for Focus Trail — version bump, changelog, tag, and push (triggers web deploy + desktop build). Use when releasing a new version or reasoning about versioning.
---

# Releasing

Releases are driven from the repo **root** via changelogen.

- `npm run release` — bump inferred from conventional commits.
- `npm run release:minor` / `npm run release:major` — force the bump type.

Each script runs: `changelogen --release ...` (bumps root `package.json` + CHANGELOG, commits, tags) → `node scripts/sync-versions.mjs --amend` (copies the version into `frontend`, `backend`, and `frontend/src-tauri/tauri.conf.json` + lockfiles, folded into the same release commit and tag) → `git push --follow-tags`.

The push triggers:
- **Deploy to VPS** (on `main` push) → web deploy.
- **Build desktop (Tauri)** (on `v*` tag) → installers attached to the GitHub Release.

## Semver 0.x caveat

While the major is 0, changelogen treats `--major` as a breaking change *within* 0.x and bumps the **minor** (e.g. `0.1.11` → `0.2.0`), not `1.0.0`. To force the first stable `1.0.0`, set it explicitly:

```bash
npm version 1.0.0 --no-git-tag-version
npx changelogen --output CHANGELOG.md
node scripts/sync-versions.mjs
git add -A && git commit -m "chore(release): v1.0.0"
git tag -a v1.0.0 -m v1.0.0
git push --follow-tags
```

From `1.x`, `--major` behaves normally (→ `2.0.0`).

## Gotcha

`changelogen --release` by itself does NOT push. Always push the **branch**, not just tags: the desktop build triggers on the tag, but the web deploy triggers on the `main` branch push. The release scripts already handle this with `git push --follow-tags`.
