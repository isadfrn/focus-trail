import { describe, expect, it } from "vitest";

import { supportedLocales, type Locale } from "../lib/locale";
import en from "./resources/en.json";
import es from "./resources/es.json";
import pt from "./resources/pt.json";

const resources: Record<Locale, unknown> = { pt, en, es };

function collectEntries(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(
    ([key, value]) => collectEntries(value, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/{{\s*([\w.]+)\s*}}/g)]
    .map((match) => match[1] ?? "")
    .sort();
}

describe("translation resources", () => {
  const referenceEntries = collectEntries(pt);
  const referenceKeys = referenceEntries.map(([key]) => key);

  it.each(supportedLocales)(
    "%s has the same keys as the source locale",
    (locale) => {
      const keys = collectEntries(resources[locale]).map(([key]) => key);
      expect(keys).toEqual(referenceKeys);
    },
  );

  it.each(supportedLocales)("%s has no empty text", (locale) => {
    for (const [, text] of collectEntries(resources[locale])) {
      expect(text.trim()).not.toBe("");
    }
  });

  it.each(supportedLocales)(
    "%s keeps the same placeholders as the source locale",
    (locale) => {
      const entries = new Map(collectEntries(resources[locale]));
      for (const [key, referenceText] of referenceEntries) {
        expect(placeholdersOf(entries.get(key) ?? "")).toEqual(
          placeholdersOf(referenceText),
        );
      }
    },
  );
});
