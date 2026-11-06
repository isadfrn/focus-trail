export const supportedThemes = ["light", "dark"] as const;

export type Theme = (typeof supportedThemes)[number];

export const defaultTheme: Theme = "light";

export const themeStorageKey = "ft_theme";

export const browserChromeColorByTheme: Record<Theme, string> = {
  light: "#faf7f1",
  dark: "#17131f",
};

export function isTheme(value: unknown): value is Theme {
  return (
    typeof value === "string" &&
    (supportedThemes as readonly string[]).includes(value)
  );
}

export function resolveTheme(stored: string | null): Theme {
  return isTheme(stored) ? stored : defaultTheme;
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", browserChromeColorByTheme[theme]);
}
