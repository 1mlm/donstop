"use client";

import {
  Add01Icon,
  ArrowDataTransferDiagonalIcon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  PartyIcon,
  Play,
  StopIcon,
  Undo03Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import type { HistoryActivityItem, TaskHistoryEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/util";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import {
  RELATIVE_TOOLTIP_THRESHOLD_SECONDS,
  TASK_SYNC_STATUS_ICON,
} from "./history.constants";
import {
  formatRelativeDuration,
  getElapsedSecondsFromNow,
  getTaskRepositionDescription,
} from "./history.utils";

function ActivityBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none">
      {children}
    </span>
  );
}

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

function TaskRepositionedActivity({ item }: { item: HistoryActivityItem }) {
  const move = getTaskRepositionDescription(item);

  return (
    <>
      <Icon
        icon={ArrowDataTransferDiagonalIcon}
        className="mx-1 inline size-3.5"
      />
      <span>Repositioned </span>
      <ActivityBadge>{item.taskLabel}</ActivityBadge>

      {move.isSubtaskMove && move.parent ? (
        <>
          <span> to a subtask of </span>
          <ActivityBadge>{move.parent}</ActivityBadge>
        </>
      ) : (
        <span> in root tasks</span>
      )}

      {move.targetDescriptor === "between" && move.before && move.after ? (
        <>
          <span> between </span>
          <ActivityBadge>{move.before}</ActivityBadge>
          <span> and </span>
          <ActivityBadge>{move.after}</ActivityBadge>
        </>
      ) : null}

      {move.targetDescriptor === "to_start" ? <span> to the start</span> : null}
      {move.targetDescriptor === "to_end" ? <span> to the end</span> : null}
      {move.targetDescriptor === "single_item" ? (
        <span> as the only item</span>
      ) : null}
    </>
  );
}

export function HistoryActivityLine({
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
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_created" ? (
          <>
            <Icon icon={Add01Icon} className="mx-1 inline size-3.5" />
            <span>Created </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_transferred" ? (
          <>
            <Icon
              icon={ArrowDataTransferDiagonalIcon}
              className="mx-1 inline size-3.5"
            />
            <span>Transferred </span>
            <ActivityBadge>{item.sourceTaskLabel || "Unknown"}</ActivityBadge>
            <span> to </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_repositioned" ? (
          <TaskRepositionedActivity item={item} />
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
              <ActivityBadge>
                {sourceTaskHistory?.taskLabel || item.taskLabel}
              </ActivityBadge>
            )}
            {typeof durationSeconds === "number" ? (
              <span> after {formatRelativeDuration(durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_finished" ? (
          <>
            <Icon icon={PartyIcon} className="mx-1 inline size-3.5" />
            <span>Finished </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
            {typeof item.durationSeconds === "number" ? (
              <span> in {formatRelativeDuration(item.durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_restored" ? (
          <>
            <Icon icon={UndoIcon} className="mx-1 inline size-3.5" />
            <span>Restored </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_cancelled" ? (
          <>
            <Icon icon={Undo03Icon} className="mx-1 inline size-3.5" />
            <span>Cancelled </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
            {typeof item.durationSeconds === "number" ? (
              <span> after {formatRelativeDuration(item.durationSeconds)}</span>
            ) : null}
          </>
        ) : item.kind === "task_renamed" ? (
          <>
            <Icon icon={Edit02Icon} className="mx-1 inline size-3.5" />
            <span>Renamed </span>
            <ActivityBadge>{item.oldLabel || item.taskLabel}</ActivityBadge>
            <span> to </span>
            <ActivityBadge>{item.newLabel || item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_deleted" ? (
          <>
            <Icon icon={Delete02Icon} className="mx-1 inline size-3.5" />
            <span>Deleted </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
          </>
        ) : item.kind === "task_copied" ? (
          <>
            <Icon icon={Copy01Icon} className="mx-1 inline size-3.5" />
            <span>Copied </span>
            <ActivityBadge>
              {item.copyTarget === "id" ? "ID" : "Name"}
            </ActivityBadge>
            <span> from </span>
            <ActivityBadge>{item.taskLabel}</ActivityBadge>
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
