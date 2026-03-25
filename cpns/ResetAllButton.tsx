"use client";

import {
  BlackHoleIcon,
  CloudOffIcon,
  HourglassIcon,
  NewsIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { googleLogout } from "@react-oauth/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PRIMARY_COLOR,
  SETTINGS_RESET_EVENT,
} from "@/cpns/settings/settings.constants";
import {
  applyCursorEnabled,
  applyPrimaryColor,
  writeStoredCursorEnabled,
  writeStoredPrimaryColor,
} from "@/cpns/settings/settings.utils";
import {
  clearStoredGoogleCalendarAuth,
  GOOGLE_CALENDAR_RESET_EVENT,
} from "@/lib/calendar";
import { useTODOStore } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { Icon } from "./Icon";

const RESET_CONFIRM_TEXT = "reset all";
const WAIT_BEFORE_CONFIRM_MS = 10_000;
const RESET_TOOLTIP_LEAVE_DELAY_MS = 500;

export default function ResetAllButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [triggerStep, setTriggerStep] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [isWaitDone, setIsWaitDone] = useState(false);
  const waitTimeoutRef = useRef<number | null>(null);
  const leaveResetTimeoutRef = useRef<number | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement | null>(null);

  const tasksCount = useTODOStore((state) => state.tasks.length);
  const historyCount = useTODOStore((state) =>
    state.activity.length > 0 ? state.activity.length : state.history.length,
  );
  const wipeAllData = useTODOStore((state) => state.wipeAllData);

  const restartWaitGate = useCallback(() => {
    setIsWaitDone(false);

    if (waitTimeoutRef.current !== null) {
      window.clearTimeout(waitTimeoutRef.current);
    }

    waitTimeoutRef.current = window.setTimeout(() => {
      setIsWaitDone(true);
      waitTimeoutRef.current = null;
    }, WAIT_BEFORE_CONFIRM_MS);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setIsWaitDone(false);

      if (waitTimeoutRef.current !== null) {
        window.clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }
      return;
    }

    restartWaitGate();

    return () => {
      if (waitTimeoutRef.current !== null) {
        window.clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }
    };
  }, [isOpen, restartWaitGate]);

  const isPhraseValid = useMemo(
    () => confirmText.trim().toLowerCase() === RESET_CONFIRM_TEXT,
    [confirmText],
  );

  const canConfirm = isWaitDone && isPhraseValid;
  const isTooltipOpen = !isOpen && (isTriggerHovered || triggerStep > 0);

  const tooltipContent =
    triggerStep === 0 ? (
      <span>RESET EVERYTHING</span>
    ) : triggerStep === 1 ? (
      <span>ARE YOU SURE YOU WANT TO RESET EVERYTHING?</span>
    ) : (
      <span>
        ARE YOU <strong>ABSOLUTELY</strong> SURE?
      </span>
    );

  useEffect(() => {
    if (isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!triggerWrapRef.current) {
        return;
      }

      const target = event.target as Node | null;

      if (target && !triggerWrapRef.current.contains(target)) {
        setTriggerStep(0);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        return;
      }

      // Re-entering the viewport should re-arm both safeguards.
      setConfirmText("");
      restartWaitGate();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isOpen, restartWaitGate]);

  useEffect(() => {
    return () => {
      if (leaveResetTimeoutRef.current !== null) {
        window.clearTimeout(leaveResetTimeoutRef.current);
      }
    };
  }, []);

  const handleTriggerClick = () => {
    if (leaveResetTimeoutRef.current !== null) {
      window.clearTimeout(leaveResetTimeoutRef.current);
      leaveResetTimeoutRef.current = null;
    }

    const nextStep = triggerStep + 1;

    if (nextStep >= 3) {
      setIsTriggerHovered(false);
      setTriggerStep(0);
      setIsOpen(true);
      return;
    }

    setTriggerStep(nextStep);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <div ref={triggerWrapRef}>
        <Tooltip open={isTooltipOpen}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full squircle squircle-full text-muted-foreground hover:text-foreground"
              aria-label="Reset everything"
              onMouseEnter={() => {
                if (leaveResetTimeoutRef.current !== null) {
                  window.clearTimeout(leaveResetTimeoutRef.current);
                  leaveResetTimeoutRef.current = null;
                }
                setIsTriggerHovered(true);
              }}
              onMouseLeave={() => {
                setIsTriggerHovered(false);
                if (leaveResetTimeoutRef.current !== null) {
                  window.clearTimeout(leaveResetTimeoutRef.current);
                }
                leaveResetTimeoutRef.current = window.setTimeout(() => {
                  setTriggerStep(0);
                  leaveResetTimeoutRef.current = null;
                }, RESET_TOOLTIP_LEAVE_DELAY_MS);
              }}
              onClick={handleTriggerClick}
            >
              <Icon icon={BlackHoleIcon} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </div>

      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-2xl leading-tight uppercase">
            ARE YOU ABSOLUTELY SURE YOU WANT TO DO THIS?
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">
            This will permanently remove the following data:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Icon icon={CloudOffIcon} className="size-4 text-destructive" />
              Google integration (you will need to login again)
            </li>
            <li className="flex items-center gap-2">
              <Icon icon={Task01Icon} className="size-4 text-destructive" />
              {tasksCount} {tasksCount === 1 ? "task" : "tasks"}
            </li>
            <li className="flex items-center gap-2">
              <Icon icon={NewsIcon} className="size-4 text-destructive" />
              {historyCount}{" "}
              {historyCount === 1 ? "history log" : "history logs"}
            </li>
            <li className="flex items-center gap-2">
              <Icon icon={BlackHoleIcon} className="size-4 text-destructive" />
              Settings (custom cursors + primary color) reset to defaults
              <span className="text-foreground">{DEFAULT_PRIMARY_COLOR}</span>
            </li>
          </ul>
          <div className="rounded-md border border-border/70 bg-muted/30 p-2 text-xs leading-relaxed">
            This will not delete the existing events in your Google Calendar as
            they are stored and handled by Google, not us.
          </div>
          <p>
            Type{" "}
            <span className="font-semibold text-foreground">Reset All</span>{" "}
            below and wait until the confirmation unlocks.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            value={confirmText}
            autoCapitalize="words"
            onChange={(event) => setConfirmText(event.target.value)}
            aria-label="Type reset all to confirm"
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (waitTimeoutRef.current !== null) {
                window.clearTimeout(waitTimeoutRef.current);
                waitTimeoutRef.current = null;
              }
              setConfirmText("");
              setIsWaitDone(false);
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm}
            loading={!isWaitDone}
            loadingIcon={HourglassIcon}
            onClick={() => {
              googleLogout();
              clearStoredGoogleCalendarAuth();
              window.dispatchEvent(new Event(GOOGLE_CALENDAR_RESET_EVENT));

              writeStoredCursorEnabled(true);
              writeStoredPrimaryColor(DEFAULT_PRIMARY_COLOR);
              applyCursorEnabled(true);
              applyPrimaryColor(DEFAULT_PRIMARY_COLOR);
              window.dispatchEvent(new Event(SETTINGS_RESET_EVENT));

              wipeAllData();
              setIsOpen(false);
              // refresh the page so the app re-initializes with cleared data
              try {
                window.location.reload();
              } catch {
                // fallback
                location.reload();
              }
            }}
          >
            {isWaitDone ? "Delete Everything" : "Read first"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
