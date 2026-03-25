"use client";

import {
  BlackHole01Icon,
  CamperIcon,
  CursorMagicSelection04Icon,
  Settings01Icon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import ResetAllButton from "@/cpns/ResetAllButton";
import { useTODOStore } from "@/lib/store";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Switch } from "@/shadcn/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import { PrimaryColorSection } from "./PrimaryColorSection";
import { SettingRow } from "./SettingRow";
import {
  useCursorEnabledEffect,
  useSettingsBootEffect,
} from "./settings.effects";
import {
  SETTINGS_PANEL_CLASS,
  SETTINGS_SECTION_STACK_CLASS,
  SETTINGS_TRIGGER_CLASS,
} from "./settings.styles";
import { writeStoredCursorEnabled } from "./settings.utils";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
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

  useSettingsBootEffect({ setCursorEnabled, setPrimaryColor });
  useCursorEnabledEffect(cursorEnabled);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={SETTINGS_TRIGGER_CLASS}
              aria-label="Settings"
            >
              <Icon icon={Settings01Icon} />
              <span>Settings</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className={SETTINGS_PANEL_CLASS}>
        <div className={SETTINGS_SECTION_STACK_CLASS}>
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

          <PrimaryColorSection
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            onPrimaryColorChanged={(nextColor) => {
              if (nextColor !== primaryColor) {
                logSettingsPrimaryColorChanged(primaryColor, nextColor);
              }
            }}
          />

          <SettingRow icon={BlackHole01Icon} title="Erase everything">
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
              Populate
            </Button>
          </SettingRow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
