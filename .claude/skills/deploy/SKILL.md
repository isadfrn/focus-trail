---
name: deploy
description: Deploy Focus Trail and troubleshoot why changes are not live on the web or desktop. Use when a deploy did not reflect, or when configuring caching/CI for the deploy.
---

# Deploy

- **Web**: `.github/workflows/deploy.yml` runs on **push to `main`**, builds the frontend (`VITE_API_BASE=/focus/api`) and ships it to the VPS. nginx serves it at `https://isabellanunes.dev/focus/` and proxies `/api` to the backend container.
- **Desktop**: `.github/workflows/desktop-build.yml` runs on **`v*` tag** push.

## "Changes didn't reflect" checklist

1. **Was the branch pushed?** A tag push triggers the desktop build but NOT the web deploy. Push `main` (the release scripts use `git push --follow-tags`).
2. **Is the deployed bundle new?** `curl -s https://isabellanunes.dev/focus/ | grep -o '/focus/assets/index-[^"]*\.js'` — the hash changes when a new build ships.
3. **Is the code on `main`?** Check `origin/main` or the GitHub API; unpushed local commits won't deploy.
4. **Cache.** The deployed `index.html` must send `Cache-Control: no-cache` so browsers and the desktop WebView2 revalidate; without it, stale HTML (pointing to the old JS) is served until cache expires. Fix in nginx on the VPS:

```nginx
location = /focus/index.html {
  add_header Cache-Control "no-cache" always;
}
location ^~ /focus/assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```

Hashed assets under `/focus/assets/` are safe to cache forever; `index.html` must always revalidate. For a stale desktop app specifically, also clear its WebView2 cache — see the `desktop-app` skill.
