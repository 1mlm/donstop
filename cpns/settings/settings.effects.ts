import { useEffect } from "react";
import {
  DEFAULT_PRIMARY_COLOR,
  SETTINGS_RESET_EVENT,
} from "./settings.constants";
import {
  applyCursorEnabled,
  applyPrimaryColor,
  readStoredCursorEnabled,
  readStoredPrimaryColor,
} from "./settings.utils";

export function useSettingsBootEffect({
  setCursorEnabled,
  setPrimaryColor,
}: {
  setCursorEnabled: (enabled: boolean) => void;
  setPrimaryColor: (color: string) => void;
}) {
  useEffect(() => {
    const enabled = readStoredCursorEnabled();
    const primaryColor = readStoredPrimaryColor();

    setCursorEnabled(enabled);
    setPrimaryColor(primaryColor);
    applyCursorEnabled(enabled);
    applyPrimaryColor(primaryColor);

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
  }, [setCursorEnabled, setPrimaryColor]);
}

export function useCursorEnabledEffect(cursorEnabled: boolean) {
  useEffect(() => {
    applyCursorEnabled(cursorEnabled);
  }, [cursorEnabled]);
}
