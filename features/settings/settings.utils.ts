import { safeLocalStorage } from "@/lib/safe-local-storage";
import {
  CURSOR_ENABLED_KEY,
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_COLOR_KEY,
  TAILWIND_500_COLORS,
  THEME_KEY,
} from "./settings.constants";

export type AppTheme = "light" | "dark" | "system";

let _systemThemeQuery: MediaQueryList | null = null;
let _systemThemeListener: (() => void) | null = null;

function syncSystemDarkClass(mq: MediaQueryList) {
  document.documentElement.classList.toggle("dark", mq.matches);
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;

  if (_systemThemeListener && _systemThemeQuery) {
    _systemThemeQuery.removeEventListener("change", _systemThemeListener);
    _systemThemeListener = null;
    _systemThemeQuery = null;
  }

  if (theme === "dark") {
    root.style.setProperty("color-scheme", "dark");
    root.classList.add("dark");
  } else if (theme === "light") {
    root.style.setProperty("color-scheme", "light");
    root.classList.remove("dark");
  } else {
    root.style.removeProperty("color-scheme");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    syncSystemDarkClass(mq);
    _systemThemeQuery = mq;
    _systemThemeListener = () => syncSystemDarkClass(mq);
    mq.addEventListener("change", _systemThemeListener);
  }
}

export function readStoredTheme(): AppTheme {
  const v = safeLocalStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark") return v;
  return "system";
}

export function writeStoredTheme(theme: AppTheme) {
  safeLocalStorage.setItem(THEME_KEY, theme);
}

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

export function readStoredCursorEnabled() {
  return safeLocalStorage.getItem(CURSOR_ENABLED_KEY) !== "0";
}

export function writeStoredCursorEnabled(enabled: boolean) {
  safeLocalStorage.setItem(CURSOR_ENABLED_KEY, enabled ? "1" : "0");
}

export function readStoredPrimaryColor() {
  const savedPrimary = safeLocalStorage.getItem(PRIMARY_COLOR_KEY);
  const hasKnownPaletteColor = TAILWIND_500_COLORS.some(
    (color) => color.value === savedPrimary,
  );

  if (savedPrimary && hasKnownPaletteColor) {
    return savedPrimary;
  }

  return DEFAULT_PRIMARY_COLOR;
}

export function writeStoredPrimaryColor(color: string) {
  safeLocalStorage.setItem(PRIMARY_COLOR_KEY, color);
}
