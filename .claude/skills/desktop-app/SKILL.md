---
name: desktop-app
description: Work on the Focus Trail desktop (Tauri) app — architecture, building, the auto-updater, code signing, and troubleshooting (e.g. changes not showing, login broken). Use for anything about the Windows/macOS/Linux desktop build.
---

# Desktop app (Tauri v2)

The desktop app is a **wrapper**: `frontend/src-tauri/tauri.conf.json` sets `build.frontendDist` and `devUrl` to the live site (`https://isabellanunes.dev/focus/`). It loads the deployed web app at runtime — no bundled frontend. So **web deploys reflect automatically**; you only rebuild the installer for native-shell changes (Rust, window, icon, updater, or the pointed URL).

## Build

- Prereqs: Rust (rustup) + MSVC C++ Build Tools (Windows); WebView2 ships with Windows 11.
- `cd frontend && npm run desktop:build`, or the CI workflow `.github/workflows/desktop-build.yml` (builds macOS/Windows/Linux on `v*` tag and attaches installers to the GitHub Release; each platform must build on its own OS — Tauri does not cross-compile).
- Windows: distribute the **NSIS `-setup.exe`** (the updater uses NSIS, not the `.msi`).

## Auto-updater

Configured via `plugins.updater` in `tauri.conf.json` (endpoint = `releases/latest/download/latest.json`, `pubkey`), `bundle.createUpdaterArtifacts: true`, `tauri-plugin-updater` in `Cargo.toml`, and a Rust-side check in `src/lib.rs` (checks/downloads/installs/restarts on startup, release builds only — driven from Rust because the wrapper loads a remote origin).

- CI signs artifacts and generates `latest.json` when the GitHub secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` are set. Generate a keypair with `npx tauri signer generate` (public key → `tauri.conf.json`, private key → secret). Keep the private key backed up; losing it breaks future signed updates.
- The updater only activates from a version that already includes it — install that version once manually.

## Troubleshooting "changes not showing"

- **Old installer**: if login fails in the app, it's likely a pre-wrapper build that bundled local assets. Install the latest release installer.
- **WebView2 cache**: the app keeps cache + cookies in `%LOCALAPPDATA%\dev.isabellanunes.focustrail\EBWebView` (survives reinstall). Close the app and delete that folder to force a fresh load (this also logs you out). The durable fix is the nginx `Cache-Control` header — see the `deploy` skill.
