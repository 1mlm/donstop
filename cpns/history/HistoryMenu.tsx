"use client";

import {
  Add01Icon,
  ArrowDataTransferDiagonalIcon,
  ArrowDown01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  NewsIcon,
  PaintBrush04Icon,
  PartyIcon,
  Play,
  StopIcon,
  Undo03Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { useTODOStore } from "@/lib/store";
import type { HistoryActivityItem, TaskHistoryEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/util";
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
import {
  RELATIVE_TOOLTIP_THRESHOLD_SECONDS,
  TASK_SYNC_STATUS_ICON,
} from "./history.constants";
import { useHistoryNowMsEffect } from "./history.effects";
import {
  buildDisplayActivity,
  buildSyncedAtByEntryID,
  formatRelativeDuration,
  getElapsedSecondsFromNow,
  isSameLocalDay,
} from "./history.utils";

function RelativeTimestamp({
  isoString,
  className,
  withAgo = true,
  nowMs,
  enableTooltip = true,
}: {
  isoString: string;
  className?: string;
  withAgo?: boolean;
  nowMs?: number;
  enableTooltip?: boolean;
}) {
  const elapsed = getElapsedSecondsFromNow(isoString, nowMs);
  const timestampClassName = `cursor-info-custom font-mono tabular-nums whitespace-nowrap ${className || ""}`;

  if (elapsed === null) {
    return <span className={timestampClassName}>Invalid date</span>;
  }

  const label = withAgo
    ? `${formatRelativeDuration(elapsed)} ago`
    : formatRelativeDuration(elapsed);

  if (!enableTooltip || elapsed <= RELATIVE_TOOLTIP_THRESHOLD_SECONDS) {
    return <span className={timestampClassName}>{label}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={timestampClassName}>{label}</span>
      </TooltipTrigger>
      <TooltipContent className="cursor-info-custom">
        {formatDateTime(isoString)}
      </TooltipContent>
    </Tooltip>
  );
}

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
              className="rounded-full squircle squircle-full px-3"
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
          className="w-[34rem] max-w-[calc(100vw-2rem)] p-2"
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
                    className="h-8 w-8 px-0"
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

function HistoryActivityLine({
  item,
  nowMs,
  historyByID,
  taskByID,
  syncedAtByEntryID,
}: {
  item: HistoryActivityItem;
  nowMs: number;
  historyByID: Map<string, TaskHistoryEntry>;
  taskByID: Map<string, { id: string; label: string }>;
  syncedAtByEntryID: Map<string, string>;
}) {
  const sourceTaskHistory = historyByID.get(item.taskHistoryEntryID);
  const currentTask = sourceTaskHistory
    ? taskByID.get(sourceTaskHistory.taskId)
    : null;
  const durationSeconds =
    sourceTaskHistory?.durationSeconds ?? item.durationSeconds ?? null;
  const syncStatus = sourceTaskHistory?.calendarSyncStatus;
  const syncIcon = syncStatus ? TASK_SYNC_STATUS_ICON[syncStatus] : null;
  const syncedAt = syncedAtByEntryID.get(item.taskHistoryEntryID) ?? null;
  const syncDelaySeconds =
    syncedAt && sourceTaskHistory?.endedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(syncedAt).getTime() -
              new Date(sourceTaskHistory.endedAt).getTime()) /
              1000,
          ),
        )
      : null;
  const hasTaskBeenDeleted = Boolean(sourceTaskHistory && !currentTask);
  const hasTaskBeenRenamed = Boolean(
    sourceTaskHistory &&
      currentTask &&
      currentTask.label !== sourceTaskHistory.taskLabel,
  );

  const syncTooltipText =
    syncStatus === "pending"
      ? "Not synchronized with Google Calendar integration"
      : syncStatus === "failed"
        ? "Google Calendar synchronization failed"
        : syncStatus === "deleted"
          ? "Google Calendar event was deleted"
          : null;

  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div className="min-w-0 text-xs text-foreground">
        <RelativeTimestamp
          isoString={item.createdAt}
          className="text-muted-foreground"
          nowMs={nowMs}
        />{" "}
        {item.kind === "task_started" ? (
          <>
            <Icon icon={Play} className="mx-1 inline size-3.5" />
            <span>Started </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_created" ? (
          <>
            <Icon icon={Add01Icon} className="mx-1 inline size-3.5" />
            <span>Created </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_transferred" ? (
          <>
            <Icon
              icon={ArrowDataTransferDiagonalIcon}
              className="mx-1 inline size-3.5"
            />
            <span>Transferred </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.sourceTaskLabel || "Unknown"}
            </span>
            <span> to </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_session" ? (
          <>
            <Icon icon={StopIcon} className="mx-1 inline size-3.5" />
            <span>Stopped </span>
            {hasTaskBeenDeleted ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
                    <Icon icon={Delete02Icon} className="size-3.5" />
                    {sourceTaskHistory?.taskLabel || item.taskLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Task was deleted after this session was recorded.
                </TooltipContent>
              </Tooltip>
            ) : hasTaskBeenRenamed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
                    <Icon icon={Edit02Icon} className="size-3.5" />
                    {sourceTaskHistory?.taskLabel || item.taskLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Task name was later edited from {sourceTaskHistory?.taskLabel}{" "}
                  to {currentTask?.label}.
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
                {sourceTaskHistory?.taskLabel || item.taskLabel}
              </span>
            )}
            {typeof durationSeconds === "number" ? (
              <span> after {formatRelativeDuration(durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_finished" ? (
          <>
            <Icon icon={PartyIcon} className="mx-1 inline size-3.5" />
            <span>Finished </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
            {typeof item.durationSeconds === "number" ? (
              <span> in {formatRelativeDuration(item.durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_restored" ? (
          <>
            <Icon icon={UndoIcon} className="mx-1 inline size-3.5" />
            <span>Restored </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_cancelled" ? (
          <>
            <Icon icon={Undo03Icon} className="mx-1 inline size-3.5" />
            <span>Cancelled </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
            {typeof item.durationSeconds === "number" ? (
              <span> after {formatRelativeDuration(item.durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_renamed" ? (
          <>
            <Icon icon={Edit02Icon} className="mx-1 inline size-3.5" />
            <span>Renamed </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.oldLabel || item.taskLabel}
            </span>
            <span> to </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.newLabel || item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_deleted" ? (
          <>
            <Icon icon={Delete02Icon} className="mx-1 inline size-3.5" />
            <span>Deleted </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : item.kind === "task_copied" ? (
          <>
            <Icon icon={Copy01Icon} className="mx-1 inline size-3.5" />
            <span>Copied </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.copyTarget === "id" ? "ID" : "Name"}
            </span>
            <span> from </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
              {item.taskLabel}
            </span>
          </>
        ) : null}
      </div>

      {syncIcon && (syncStatus === "synced" || syncTooltipText) ? (
        <div className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Icon icon={syncIcon} className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {syncStatus === "synced" ? (
                syncDelaySeconds !== null && syncDelaySeconds > 10 ? (
                  <span>
                    Synchronized with Google Calendar{" "}
                    <span className="underline decoration-dotted">
                      {formatRelativeDuration(syncDelaySeconds)} after
                    </span>
                  </span>
                ) : (
                  <span>Immediately synchronized with Google Calendar</span>
                )
              ) : (
                <span>{syncTooltipText}</span>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      ) : item.kind === "task_transferred" &&
        typeof item.durationSeconds === "number" ? (
        <div className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
          {formatRelativeDuration(item.durationSeconds)}
        </div>
      ) : null}
    </div>
  );
}
