"use client";

import {
  ArrowDown01Icon,
  NewsIcon,
  PaintBrush04Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { useTODOStore } from "@/lib/store";
import type { HistoryActivityItem, TaskHistoryEntry } from "@/lib/types";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import { HistoryActivityLine } from "./HistoryActivityLine";
import { useHistoryNowMsEffect } from "./history.effects";
import {
  buildDisplayActivity,
  buildSyncedAtByEntryID,
  isSameLocalDay,
} from "./history.utils";

export default function HistoryMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nowMs = useHistoryNowMsEffect();
  const activity = useTODOStore(
    (state) => state.activity,
  ) as HistoryActivityItem[];
  const history = useTODOStore((state) => state.history) as TaskHistoryEntry[];
  const tasks = useTODOStore((state) => state.tasks);
  const clearHistory = useTODOStore((state) => state.clearHistory);

  const allDisplayActivity = buildDisplayActivity(activity, history);

  const recentActivity = allDisplayActivity.slice(0, 14);
  const todayISO = new Date(nowMs).toISOString();
  const todayLogsCount = allDisplayActivity.filter((item) =>
    isSameLocalDay(item.createdAt, todayISO),
  ).length;
  const historyByID = new Map<string, TaskHistoryEntry>(
    history.map((entry: TaskHistoryEntry) => [entry.id, entry]),
  );
  const taskByID = new Map(tasks.map((task) => [task.id, task]));
  const syncedAtByEntryID = buildSyncedAtByEntryID(activity);

  const isEmpty = history.length === 0 && activity.length === 0;

  if (isEmpty) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full squircle squircle-full px-3 cursor-pointer disabled:cursor-not-allowed"
              disabled
              aria-label="History"
            >
              <Icon icon={NewsIcon} />
              Empty History
            </Button>
          </TooltipTrigger>
          <TooltipContent>History is empty.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full squircle squircle-full px-3"
          >
            <Icon icon={NewsIcon} />
            History
            <Icon
              icon={ArrowDown01Icon}
              className={`size-4 transition-transform ${
                isMenuOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="bottom"
          className="w-[34rem] max-w-[calc(100vw-2rem)] p-2 max-md:fixed max-md:inset-0 max-md:h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-4 max-md:!left-0 max-md:!top-0 max-md:!transform-none"
        >
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>
                {allDisplayActivity.length} total logs - {todayLogsCount} today
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 px-0 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Clear history"
                    onClick={() => {
                      clearHistory();
                      setIsMenuOpen(false);
                    }}
                    disabled={history.length === 0 && activity.length === 0}
                  >
                    <Icon icon={PaintBrush04Icon} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear history</TooltipContent>
              </Tooltip>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {recentActivity.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              History is empty.
            </div>
          ) : (
            <div className="max-h-[65vh] space-y-2 overflow-auto p-1">
              {recentActivity.map((item: HistoryActivityItem) => (
                <HistoryActivityLine
                  key={item.id}
                  item={item}
                  nowMs={nowMs}
                  historyByID={historyByID}
                  taskByID={taskByID}
                  syncedAtByEntryID={syncedAtByEntryID}
                />
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
