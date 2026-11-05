import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localeStorageKey } from "../lib/locale";
import i18n, { changeLocale } from "./index";

describe("changeLocale", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("switches the language, persists the choice and updates the document language", async () => {
    await changeLocale("es");
    expect(i18n.language).toBe("es");
    expect(localStorage.getItem(localeStorageKey)).toBe("es");
    expect(document.documentElement.lang).toBe("es");

    await changeLocale("pt");
    expect(localStorage.getItem(localeStorageKey)).toBe("pt");
    expect(document.documentElement.lang).toBe("pt-BR");
  });
});

describe("i18n instance", () => {
  it("translates in the active language and falls back to the source locale", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("errors.generic")).toBe("Something went wrong. Try again.");

    await i18n.changeLanguage("fr");
    expect(i18n.t("errors.generic")).toBe("Algo deu errado. Tente de novo.");
  });
});

describe("i18n initial language", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  async function loadFreshInstance() {
    const module = await import("./index");
    return module.default;
  }

  it("uses the stored locale", async () => {
    localStorage.setItem(localeStorageKey, "en");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-AR"]);

    const fresh = await loadFreshInstance();

    expect(fresh.language).toBe("en");
  });

  it("falls back to the browser language when nothing is stored", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["fr-FR", "es-AR"]);

    const fresh = await loadFreshInstance();

    expect(fresh.language).toBe("es");
    expect(localStorage.getItem(localeStorageKey)).toBeNull();
  });

  it("uses navigator.language when the languages list is empty", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue([]);
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-GB");

    const fresh = await loadFreshInstance();

    expect(fresh.language).toBe("en");
  });
});
