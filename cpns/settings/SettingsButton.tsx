"use client";

import {
  BlackHole01Icon,
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
import { useCursorEnabledEffect, useSettingsBootEffect } from "./settings.effects";
import {
  SETTINGS_PANEL_CLASS,
  SETTINGS_SECTION_STACK_CLASS,
  SETTINGS_TRIGGER_CLASS,
} from "./settings.styles";
import { writeStoredCursorEnabled } from "./settings.utils";
import { SettingRow } from "./SettingRow";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const canPopulateFakeData = useTODOStore(
    (state) => state.tasks.length === 0 && state.history.length === 0,
  );
  const populateFakeData = useTODOStore((state) => state.populateFakeData);

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
                setCursorEnabled(checked);
                writeStoredCursorEnabled(checked);
              }}
              aria-label="Toggle custom cursors"
            />
          </SettingRow>

          <PrimaryColorSection
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
          />

          <SettingRow icon={BlackHole01Icon} title="Erase everything">
            <ResetAllButton />
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
