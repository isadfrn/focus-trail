import { useTranslation } from "react-i18next";

import { changeLocale } from "../../i18n";
import {
  defaultLocale,
  isLocale,
  nativeNameByLocale,
  supportedLocales,
} from "../../lib/locale";
import { cn } from "../../lib/cn";

interface LanguageSelectProps {
  className?: string;
}

export function LanguageSelect({ className }: LanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const activeLocale = isLocale(i18n.language) ? i18n.language : defaultLocale;

  return (
    <select
      aria-label={t("language.label")}
      value={activeLocale}
      onChange={(event) => {
        const selectedLocale = event.target.value;
        if (isLocale(selectedLocale)) void changeLocale(selectedLocale);
      }}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40",
        className,
      )}
    >
      {supportedLocales.map((locale) => (
        <option key={locale} value={locale}>
          {nativeNameByLocale[locale]}
        </option>
      ))}
    </select>
  );
}
