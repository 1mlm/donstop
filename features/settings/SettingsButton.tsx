"use client";

import {
  ArrowDown01Icon,
  BlackHole01Icon,
  CamperIcon,
  ComputerIcon,
  CursorMagicSelection04Icon,
  Moon01Icon,
  Settings01Icon,
  Sun01Icon,
  TestTube01Icon,
  TimeQuarterIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import ResetAllButton from "@/features/ResetAllButton";
import { useTODOStore } from "@/lib/store";
import {
  COMMON_TIMEZONES,
  readStoredTimezone,
  setTimezone,
} from "@/lib/timezone";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import { Icon } from "../Icon";
import { PrimaryColorSection } from "./PrimaryColorSection";
import { SettingRow } from "./SettingRow";
import {
  useCursorEnabledEffect,
  useSettingsBootEffect,
} from "./settings.hooks";
import {
  type AppTheme,
  applyTheme,
  readStoredTheme,
  writeStoredCursorEnabled,
  writeStoredTheme,
} from "./settings.utils";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [timezone, setTimezoneState] = useState(() => readStoredTimezone());
  const [theme, setThemeState] = useState<AppTheme>(() => readStoredTheme());
  const canPopulateFakeData = useTODOStore(
    (state) => state.tasks.length === 0 && state.history.length === 0,
  );
  const populateFakeData = useTODOStore((state) => state.populateFakeData);
  const logSettingsCursorEnabled = useTODOStore(
    (state) => state.logSettingsCursorEnabled,
  );
  const logSettingsCursorDisabled = useTODOStore(
    (state) => state.logSettingsCursorDisabled,
  );
  const logSettingsPrimaryColorChanged = useTODOStore(
    (state) => state.logSettingsPrimaryColorChanged,
  );

  useSettingsBootEffect({
    setCursorEnabled,
    setPrimaryColor,
    setTheme: setThemeState,
  });
  useCursorEnabledEffect(cursorEnabled);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full squircle squircle-full px-3"
          aria-label="Settings"
        >
          <Icon icon={Settings01Icon} />
          <span>Settings</span>
          <Icon
            icon={ArrowDown01Icon}
            className={`transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-3">
        <div className="space-y-3">
          <SettingRow
            icon={CursorMagicSelection04Icon}
            title="Toggle custom cursors"
          >
            <Switch
              size="sm"
              checked={cursorEnabled}
              onCheckedChange={(checked) => {
                if (checked !== cursorEnabled) {
                  if (checked) {
                    logSettingsCursorEnabled();
                  } else {
                    logSettingsCursorDisabled();
                  }
                }
                setCursorEnabled(checked);
                writeStoredCursorEnabled(checked);
              }}
              aria-label="Toggle custom cursors"
            />
          </SettingRow>

          <SettingRow icon={Sun01Icon} title="Theme">
            <div className="flex gap-0.5 rounded-lg border p-0.5">
              {(
                [
                  { value: "system", icon: ComputerIcon, label: "System" },
                  { value: "light", icon: Sun01Icon, label: "Light" },
                  { value: "dark", icon: Moon01Icon, label: "Dark" },
                ] as const
              ).map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  onClick={() => {
                    setThemeState(value);
                    writeStoredTheme(value);
                    applyTheme(value);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors ${
                    theme === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon icon={icon} className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>

          <PrimaryColorSection
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            onPrimaryColorChanged={(nextColor) => {
              if (nextColor !== primaryColor) {
                logSettingsPrimaryColorChanged(primaryColor, nextColor);
              }
            }}
          />

          <SettingRow icon={TimeQuarterIcon} title="Timezone">
            <Select
              value={timezone}
              onValueChange={(tz) => {
                setTimezoneState(tz);
                setTimezone(tz);
              }}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                    className="text-xs"
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={BlackHole01Icon} title="Reset everything">
            <ResetAllButton />
          </SettingRow>

          <SettingRow icon={CamperIcon} title="Show tour">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.dispatchEvent(new Event("show-welcome-tour"))
              }
            >
              <Icon icon={CamperIcon} />
              Show tour
            </Button>
          </SettingRow>

          <SettingRow icon={TestTube01Icon} title="Populate fake data">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPopulateFakeData}
              onClick={populateFakeData}
            >
              <Icon icon={TestTube01Icon} />
              Populate
            </Button>
          </SettingRow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
