import { useTranslation } from "react-i18next";

import { cn } from "../../lib/cn";
import { isTheme, supportedThemes } from "../../lib/theme";
import { useTheme } from "../../providers/ThemeProvider";

interface ThemeSelectProps {
  className?: string;
}

export function ThemeSelect({ className }: ThemeSelectProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <select
      aria-label={t("theme.label")}
      value={theme}
      onChange={(event) => {
        const selectedTheme = event.target.value;
        if (isTheme(selectedTheme)) setTheme(selectedTheme);
      }}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40",
        className,
      )}
    >
      {supportedThemes.map((supportedTheme) => (
        <option key={supportedTheme} value={supportedTheme}>
          {t(`theme.${supportedTheme}`)}
        </option>
      ))}
    </select>
  );
}
