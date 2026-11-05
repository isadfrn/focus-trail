export const supportedLocales = ["pt", "en", "es"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "pt";

export const localeStorageKey = "ft_locale";

export const languageTagByLocale: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (supportedLocales as readonly string[]).includes(value)
  );
}

export function matchLocale(
  languageTag: string | null | undefined,
): Locale | null {
  const primarySubtag = languageTag?.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(primarySubtag) ? primarySubtag : null;
}

interface DetectLocaleParams {
  stored: string | null;
  navigatorLanguages: readonly string[];
}

export function detectLocale({
  stored,
  navigatorLanguages,
}: DetectLocaleParams): Locale {
  if (isLocale(stored)) return stored;

  for (const languageTag of navigatorLanguages) {
    const matched = matchLocale(languageTag);
    if (matched) return matched;
  }

  return defaultLocale;
}

export const nativeNameByLocale: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};
