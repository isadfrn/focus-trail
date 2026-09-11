/** Utilidades de cor para decidir contraste sobre um background arbitrario. */

/** Aceita "#rgb" ou "#rrggbb" e devolve [r, g, b] em 0..255. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(h, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Luminancia relativa (WCAG 2.x), 0 (preto) a 1 (branco). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * True quando o fundo e claro o bastante para pedir texto escuro por cima.
 * Limiar ~0.42: teal (#007474 ~= 0.14) conta como escuro; ceu de dia como claro.
 */
export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.42;
}
