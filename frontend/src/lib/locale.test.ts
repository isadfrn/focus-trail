import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  detectLocale,
  isLocale,
  languageTagByLocale,
  matchLocale,
  supportedLocales,
} from "./locale";

describe("isLocale", () => {
  it("accepts every supported locale", () => {
    for (const locale of supportedLocales) {
      expect(isLocale(locale)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("pt-BR")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("matchLocale", () => {
  it("matches a region tag by its primary subtag", () => {
    expect(matchLocale("pt-BR")).toBe("pt");
    expect(matchLocale("en-US")).toBe("en");
    expect(matchLocale("es-419")).toBe("es");
  });

  it("is case and separator insensitive", () => {
    expect(matchLocale("ES_mx")).toBe("es");
    expect(matchLocale(" EN ")).toBe("en");
  });

  it("returns null for unsupported or missing tags", () => {
    expect(matchLocale("fr-FR")).toBeNull();
    expect(matchLocale("")).toBeNull();
    expect(matchLocale(null)).toBeNull();
    expect(matchLocale(undefined)).toBeNull();
  });
});

describe("detectLocale", () => {
  it("prefers the stored locale over the browser languages", () => {
    expect(
      detectLocale({ stored: "es", navigatorLanguages: ["en-US", "pt-BR"] }),
    ).toBe("es");
  });

  it("ignores an invalid stored value", () => {
    expect(
      detectLocale({ stored: "klingon", navigatorLanguages: ["en-US"] }),
    ).toBe("en");
  });

  it("uses the first supported browser language", () => {
    expect(
      detectLocale({
        stored: null,
        navigatorLanguages: ["fr-FR", "es-AR", "en"],
      }),
    ).toBe("es");
  });

  it("falls back to the default locale", () => {
    expect(detectLocale({ stored: null, navigatorLanguages: ["fr-FR"] })).toBe(
      defaultLocale,
    );
    expect(detectLocale({ stored: null, navigatorLanguages: [] })).toBe(
      defaultLocale,
    );
  });
});

describe("languageTagByLocale", () => {
  it("maps every locale to a language tag", () => {
    for (const locale of supportedLocales) {
      expect(languageTagByLocale[locale]).toBeTruthy();
    }
    expect(languageTagByLocale.pt).toBe("pt-BR");
  });
});
