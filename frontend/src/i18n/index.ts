import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import {
  defaultLocale,
  detectLocale,
  isLocale,
  languageTagByLocale,
  localeStorageKey,
  supportedLocales,
  type Locale,
} from "../lib/locale";
import { storage } from "../lib/platform";
import en from "./resources/en.json";
import es from "./resources/es.json";
import pt from "./resources/pt.json";

function readNavigatorLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];
}

function syncDocumentLanguage(language: string) {
  if (isLocale(language)) {
    document.documentElement.lang = languageTagByLocale[language];
  }
}

void i18next.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLocale({
    stored: storage.get(localeStorageKey),
    navigatorLanguages: readNavigatorLanguages(),
  }),
  fallbackLng: defaultLocale,
  supportedLngs: supportedLocales,
  interpolation: { escapeValue: false },
  initAsync: false,
});

syncDocumentLanguage(i18next.language);

i18next.on("languageChanged", syncDocumentLanguage);

export function currentLanguageTag(): string {
  const language = i18next.language;
  return languageTagByLocale[isLocale(language) ? language : defaultLocale];
}

export async function changeLocale(locale: Locale): Promise<void> {
  storage.set(localeStorageKey, locale);
  await i18next.changeLanguage(locale);
}

export default i18next;
