import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  applyTheme,
  browserChromeColorByTheme,
  defaultTheme,
  isTheme,
  resolveTheme,
  supportedThemes,
} from "./theme";

describe("default theme", () => {
  it("is light", () => {
    expect(defaultTheme).toBe("light");
  });
});

describe("isTheme", () => {
  it("accepts every supported theme", () => {
    for (const theme of supportedThemes) {
      expect(isTheme(theme)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("returns the stored theme when it is valid", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("falls back to light when nothing valid is stored", () => {
    expect(resolveTheme(null)).toBe("light");
    expect(resolveTheme("sepia")).toBe("light");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    const themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    themeColorMeta.content = "#000000";
    document.head.append(themeColorMeta);
  });

  afterEach(() => {
    document.head.replaceChildren();
    delete document.documentElement.dataset.theme;
  });

  it("marks the document root with the theme", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("syncs the browser chrome color", () => {
    applyTheme("dark");
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    ).toBe(browserChromeColorByTheme.dark);
  });

  it("does not fail when the theme-color meta tag is missing", () => {
    document.head.replaceChildren();
    expect(() => applyTheme("light")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
