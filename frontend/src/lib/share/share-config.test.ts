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
    expect(getShareUrl()).toBe("https://focustrail.com.br/app/");
    expect(getShareLabel()).toBe("focustrail.com.br/app");
  });

  it("uses the configured URL, such as a future landing page", () => {
    vi.stubEnv("VITE_SHARE_URL", " https://focustrail.app/ ");
    expect(getShareUrl()).toBe("https://focustrail.app/");
    expect(getShareLabel()).toBe("focustrail.app");
  });

  it("adds tracking parameters without losing the base path", () => {
    vi.stubEnv("VITE_SHARE_URL", "https://focustrail.com.br/app/");
    const url = new URL(buildTrackedShareUrl("day", "x"));
    expect(url.pathname).toBe("/app/");
    expect(url.searchParams.get("utm_source")).toBe("focus-trail-share");
    expect(url.searchParams.get("utm_medium")).toBe("x");
    expect(url.searchParams.get("utm_campaign")).toBe("day");
  });
});
