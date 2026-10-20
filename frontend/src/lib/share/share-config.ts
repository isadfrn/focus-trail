const DEFAULT_SHARE_URL = "https://isabellanunes.dev/focus/";

export function getShareUrl(): string {
  const configured = import.meta.env.VITE_SHARE_URL?.trim();
  if (!configured) return DEFAULT_SHARE_URL;
  return configured;
}

export function getShareLabel(): string {
  return getShareUrl()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

export function buildTrackedShareUrl(campaign: string, medium: string): string {
  const url = new URL(getShareUrl());
  url.searchParams.set("utm_source", "focus-trail-share");
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
