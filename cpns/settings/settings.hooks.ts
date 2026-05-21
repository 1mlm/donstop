import { useEffect } from "react";
import {
  DEFAULT_PRIMARY_COLOR,
  SETTINGS_RESET_EVENT,
} from "./settings.constants";
import {
  type AppTheme,
  applyCursorEnabled,
  applyPrimaryColor,
  applyTheme,
  readStoredCursorEnabled,
  readStoredPrimaryColor,
  readStoredTheme,
} from "./settings.utils";

export function useSettingsBootEffect({
  setCursorEnabled,
  setPrimaryColor,
  setTheme,
}: {
  setCursorEnabled: (enabled: boolean) => void;
  setPrimaryColor: (color: string) => void;
  setTheme: (theme: AppTheme) => void;
}) {
  useEffect(() => {
    const enabled = readStoredCursorEnabled();
    const primaryColor = readStoredPrimaryColor();
    const theme = readStoredTheme();

    setCursorEnabled(enabled);
    setPrimaryColor(primaryColor);
    setTheme(theme);
    applyCursorEnabled(enabled);
    applyPrimaryColor(primaryColor);
    applyTheme(theme);

    const onSettingsReset = () => {
      setCursorEnabled(true);
      setPrimaryColor(DEFAULT_PRIMARY_COLOR);
      applyCursorEnabled(true);
      applyPrimaryColor(DEFAULT_PRIMARY_COLOR);
    };

    window.addEventListener(SETTINGS_RESET_EVENT, onSettingsReset);

    return () => {
      window.removeEventListener(SETTINGS_RESET_EVENT, onSettingsReset);
    };
  }, [setCursorEnabled, setPrimaryColor, setTheme]);
}

export function useCursorEnabledEffect(cursorEnabled: boolean) {
  useEffect(() => {
    applyCursorEnabled(cursorEnabled);
  }, [cursorEnabled]);
}
