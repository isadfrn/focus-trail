---
name: deploy
description: Deploy Focus Trail and troubleshoot why changes are not live on the web or desktop. Use when a deploy did not reflect, or when configuring caching/CI for the deploy.
---

# Deploy

- **Web**: `.github/workflows/deploy.yml` runs on **push to `main`**. It builds and pushes two GHCR images — `focus-trail-backend` and `focus-trail-frontend` (the frontend is built inside `frontend/Dockerfile` with `--build-arg VITE_API_BASE=/focus/api`) — then SSHes to the VPS to `docker compose pull` + `up -d`. On the VPS, three containers run from `docker-compose.prod.yml`: `db`, `api` (`127.0.0.1:3002`), and `web` (`127.0.0.1:3003`). The VPS nginx (`sites-enabled/isabellanunes.dev`) `proxy_pass`es `/focus/` → `:3003` and `/focus/api/` → `:3002`, serving everything at `https://isabellanunes.dev/focus/`.
- **Desktop**: `.github/workflows/desktop-build.yml` runs on **`v*` tag** push.

> The frontend container serves the SPA from `/usr/share/nginx/html/focus/` with its own `frontend/nginx.conf`. The VPS nginx only reverse-proxies (no `root /var/www` for `/focus/` anymore).

## "Changes didn't reflect" checklist

1. **Was the branch pushed?** A tag push triggers the desktop build but NOT the web deploy. Push `main` (the release scripts use `git push --follow-tags`).
2. **Is the deployed bundle new?** `curl -s https://isabellanunes.dev/focus/ | grep -o '/focus/assets/index-[^"]*\.js'` — the hash changes when a new build ships.
3. **Is the container new?** On the VPS, `docker ps` should show `focus-trail-web-1` recently (re)created; if not, the `docker compose pull`/`up -d` step didn't refresh it (check the deploy job logs and that GHCR pushed a new `focus-trail-frontend:latest`).
4. **Is the code on `main`?** Check `origin/main` or the GitHub API; unpushed local commits won't deploy.
5. **Cache.** The served `index.html` must send `Cache-Control: no-cache` so browsers and the desktop WebView2 revalidate; without it, stale HTML (pointing to the old JS) is served until cache expires. These headers now live in **`frontend/nginx.conf`** (inside the container) and pass through the VPS proxy:

```nginx
location = /focus/index.html {
  add_header Cache-Control "no-cache" always;
}
location ^~ /focus/assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```

Hashed assets under `/focus/assets/` are safe to cache forever; `index.html` must always revalidate. For a stale desktop app specifically, also clear its WebView2 cache — see the `desktop-app` skill.
