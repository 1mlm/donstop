import {
  CURSOR_ENABLED_KEY,
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_COLOR_KEY,
  TAILWIND_500_COLORS,
} from "./settings.constants";

export function applyCursorEnabled(enabled: boolean) {
  document.documentElement.classList.toggle("custom-cursor-enabled", enabled);
  document.body.classList.toggle("custom-cursor-enabled", enabled);

  // Force immediate cursor repaint for browsers that cache cursor URLs aggressively.
  document.body.style.cursor = "";
}

export function getContrastForeground(hexColor: string) {
  const hex = hexColor.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#111827" : "#f8fafc";
}

export function applyPrimaryColor(hexColor: string) {
  const fg = getContrastForeground(hexColor);
  const root = document.documentElement;
  root.style.setProperty("--primary", hexColor);
  root.style.setProperty("--sidebar-primary", hexColor);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--sidebar-primary-foreground", fg);
}

export function hexToOklch(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.638851707 * z);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bOk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + bOk * bOk);
  const H = Math.atan2(bOk, a) * (180 / Math.PI);
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${(H < 0 ? H + 360 : H).toFixed(1)})`;
}

export function readStoredCursorEnabled() {
  return window.localStorage.getItem(CURSOR_ENABLED_KEY) !== "0";
}

export function writeStoredCursorEnabled(enabled: boolean) {
  window.localStorage.setItem(CURSOR_ENABLED_KEY, enabled ? "1" : "0");
}

export function readStoredPrimaryColor() {
  const savedPrimary = window.localStorage.getItem(PRIMARY_COLOR_KEY);
  const hasKnownPaletteColor = TAILWIND_500_COLORS.some(
    (color) => color.value === savedPrimary,
  );

  if (savedPrimary && hasKnownPaletteColor) {
    return savedPrimary;
  }

  return DEFAULT_PRIMARY_COLOR;
}

export function writeStoredPrimaryColor(color: string) {
  window.localStorage.setItem(PRIMARY_COLOR_KEY, color);
}
