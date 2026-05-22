"use client";

import {
  Add01Icon,
  AdjustPositionIcon,
  ArrowDataTransferDiagonalIcon,
  ArrowRight01Icon,
  CalendarRemove01Icon,
  CalendarSetting01Icon,
  CloudIcon,
  Copy01Icon,
  CursorMagicSelection04Icon,
  Delete02Icon,
  Edit02Icon,
  Logout02Icon,
  MessageAdd01Icon,
  NoteEditIcon,
  PaintBrush04Icon,
  PartyIcon,
  Play,
  StopIcon,
  UnavailableIcon,
  Undo03Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { useTODOStore } from "@/lib/store";
import type {
  ActivityNote,
  HistoryActivityItem,
  TaskHistoryEntry,
} from "@/lib/types";
import { formatDateTime } from "@/lib/util";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import { TASK_SYNC_STATUS_ICON } from "./history.constants";
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

  if (!enableTooltip) {
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
      <Icon icon={AdjustPositionIcon} className="mx-1 inline size-3.5" />
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

function NotesBadge({
  notes,
  activityId,
  onAddNote,
}: {
  notes: ActivityNote[];
  activityId: string;
  onAddNote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const deleteActivityNote = useTODOStore((s) => s.deleteActivityNote);
  const count = notes.length;

  if (count === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground hover:bg-muted/80 transition-colors"
          aria-label={`${count} note${count > 1 ? "s" : ""}`}
        >
          <Icon icon={NoteEditIcon} className="size-3" />
          {count > 1 ? count : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Notes</p>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => {
              setOpen(false);
              onAddNote();
            }}
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground">{note.text}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDateTime(note.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                aria-label="Delete note"
                onClick={() => deleteActivityNote(activityId, note.id)}
              >
                <Icon icon={Delete02Icon} className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AddNoteDialog({
  activityId,
  open,
  onOpenChange,
}: {
  activityId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addActivityNote = useTODOStore((s) => s.addActivityNote);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addActivityNote(activityId, trimmed);
    setText("");
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 w-72 rounded-xl border bg-background p-4 shadow-xl space-y-3">
        <p className="text-sm font-medium">Add note</p>
        <input
          ref={(el) => {
            (
              inputRef as React.MutableRefObject<HTMLInputElement | null>
            ).current = el;
            if (el) setTimeout(() => el.focus(), 0);
          }}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onOpenChange(false);
          }}
          placeholder="Type a note..."
          className="w-full rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/50"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HistoryActivityLine({
  item,
  nowMs,
  historyByID,
  taskByID,
  syncedAtByEntryID,
  configMode = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onDelete,
}: {
  item: HistoryActivityItem;
  nowMs: number;
  historyByID: Map<string, TaskHistoryEntry>;
  taskByID: Map<string, { id: string; label: string }>;
  syncedAtByEntryID: Map<string, string>;
  configMode?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void;
}) {
  const [addNoteOpen, setAddNoteOpen] = useState(false);
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

  const notes = item.notes ?? [];

  return (
    <>
      <AddNoteDialog
        activityId={item.id}
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
      />
      <div
        className={`group flex items-center justify-between gap-2 rounded py-0.5 transition-colors ${
          isSelected ? "bg-primary/8" : ""
        }`}
      >
        {configMode ? (
          <button
            type="button"
            aria-label={isSelected ? "Deselect" : "Select"}
            onClick={onToggleSelect}
            className={`shrink-0 size-4 rounded-full border-2 transition-all flex items-center justify-center ${
              selectionMode
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } ${
              isSelected
                ? "border-primary bg-primary"
                : "border-muted-foreground/40 bg-transparent"
            }`}
          >
            {isSelected ? (
              <span className="block size-1.5 rounded-full bg-white" />
            ) : null}
          </button>
        ) : null}

        <div className="min-w-0 flex-1 text-xs text-foreground">
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
                    Task name was later edited from{" "}
                    {sourceTaskHistory?.taskLabel} to {currentTask?.label}.
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
                <span>
                  {" "}
                  after {formatRelativeDuration(item.durationSeconds)}
                </span>
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
          ) : item.kind === "calendar_connected" ? (
            <>
              <Icon icon={CloudIcon} className="mx-1 inline size-3.5" />
              <span>Connected Google Calendar</span>
              {item.subjectLabel ? (
                <>
                  <span> as </span>
                  <ActivityBadge>{item.subjectLabel}</ActivityBadge>
                </>
              ) : null}
            </>
          ) : item.kind === "calendar_disconnected" ? (
            <>
              <Icon icon={Logout02Icon} className="mx-1 inline size-3.5" />
              <span>Disconnected Google Calendar</span>
            </>
          ) : item.kind === "calendar_enabled" ? (
            <>
              <Icon
                icon={CalendarSetting01Icon}
                className="mx-1 inline size-3.5"
              />
              <span>Enabled calendar sync</span>
              {item.subjectLabel ? (
                <>
                  <span> for </span>
                  <ActivityBadge>{item.subjectLabel}</ActivityBadge>
                </>
              ) : null}
            </>
          ) : item.kind === "calendar_disabled" ? (
            <>
              <Icon
                icon={CalendarRemove01Icon}
                className="mx-1 inline size-3.5"
              />
              <span>Disabled calendar sync</span>
              {item.subjectLabel ? (
                <>
                  <span> for </span>
                  <ActivityBadge>{item.subjectLabel}</ActivityBadge>
                </>
              ) : null}
            </>
          ) : item.kind === "calendar_target_changed" ? (
            <>
              <Icon icon={ArrowRight01Icon} className="mx-1 inline size-3.5" />
              <span>Changed target calendar</span>
              {item.oldValue ? (
                <>
                  <span> from </span>
                  <ActivityBadge>{item.oldValue}</ActivityBadge>
                </>
              ) : null}
              {item.newValue ? (
                <>
                  <span> to </span>
                  <ActivityBadge>{item.newValue}</ActivityBadge>
                </>
              ) : null}
            </>
          ) : item.kind === "settings_cursor_enabled" ? (
            <>
              <Icon
                icon={CursorMagicSelection04Icon}
                className="mx-1 inline size-3.5"
              />
              <span>Enabled custom cursor</span>
            </>
          ) : item.kind === "settings_cursor_disabled" ? (
            <>
              <Icon icon={UnavailableIcon} className="mx-1 inline size-3.5" />
              <span>Disabled custom cursor</span>
            </>
          ) : item.kind === "settings_primary_color_changed" ? (
            <>
              <Icon icon={PaintBrush04Icon} className="mx-1 inline size-3.5" />
              <span>Changed primary color</span>
              {item.oldValue ? (
                <>
                  <span> from </span>
                  <ActivityBadge>{item.oldValue}</ActivityBadge>
                </>
              ) : null}
              {item.newValue ? (
                <>
                  <span> to </span>
                  <ActivityBadge>{item.newValue}</ActivityBadge>
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {syncIcon && (syncStatus === "synced" || syncTooltipText) ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex text-muted-foreground">
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
          ) : item.kind === "task_transferred" &&
            typeof item.durationSeconds === "number" ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
              {formatRelativeDuration(item.durationSeconds)}
            </span>
          ) : null}

          <NotesBadge
            notes={notes}
            activityId={item.id}
            onAddNote={() => setAddNoteOpen(true)}
          />

          {configMode ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Add note"
                    onClick={() => setAddNoteOpen(true)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-foreground transition-opacity"
                  >
                    <Icon icon={MessageAdd01Icon} className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Add note</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Delete log"
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity"
                  >
                    <Icon icon={Delete02Icon} className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete log</TooltipContent>
              </Tooltip>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
