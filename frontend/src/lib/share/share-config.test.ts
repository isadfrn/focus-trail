import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildTrackedShareUrl,
  getShareLabel,
  getShareUrl,
} from "./share-config";

describe("share-config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the deployed web app", () => {
    vi.stubEnv("VITE_SHARE_URL", "");
    expect(getShareUrl()).toBe("https://isabellanunes.dev/focus/");
    expect(getShareLabel()).toBe("isabellanunes.dev/focus");
  });

  it("uses the configured URL, such as a future landing page", () => {
    vi.stubEnv("VITE_SHARE_URL", " https://focustrail.app/ ");
    expect(getShareUrl()).toBe("https://focustrail.app/");
    expect(getShareLabel()).toBe("focustrail.app");
  });

  it("adds tracking parameters without losing the base path", () => {
    vi.stubEnv("VITE_SHARE_URL", "https://isabellanunes.dev/focus/");
    const url = new URL(buildTrackedShareUrl("day", "x"));
    expect(url.pathname).toBe("/focus/");
    expect(url.searchParams.get("utm_source")).toBe("focus-trail-share");
    expect(url.searchParams.get("utm_medium")).toBe("x");
    expect(url.searchParams.get("utm_campaign")).toBe("day");
  });
});
