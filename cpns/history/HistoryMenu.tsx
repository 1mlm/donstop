"use client";

import {
  ArrowDown01Icon,
  Delete02Icon,
  FilterIcon,
  MinusSignIcon,
  NewsIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { useTODOStore } from "@/lib/store";
import type {
  HistoryActivityItem,
  HistoryActivityKind,
  TaskHistoryEntry,
} from "@/lib/types";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import { HistoryActivityLine } from "./HistoryActivityLine";
import { useHistoryNowMsEffect } from "./history.hooks";
import {
  buildDisplayActivity,
  buildSyncedAtByEntryID,
  isSameLocalDay,
} from "./history.utils";

function groupActivity(items: HistoryActivityItem[], nowMs: number) {
  const now = new Date(nowMs);
  const todayISO = now.toISOString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: HistoryActivityItem[] = [];
  const yesterdayGroup: HistoryActivityItem[] = [];
  const thisWeek: HistoryActivityItem[] = [];
  const older: HistoryActivityItem[] = [];

  for (const item of items) {
    if (isSameLocalDay(item.createdAt, todayISO)) {
      today.push(item);
    } else if (isSameLocalDay(item.createdAt, yesterdayISO)) {
      yesterdayGroup.push(item);
    } else if (new Date(item.createdAt) >= weekStart) {
      thisWeek.push(item);
    } else {
      older.push(item);
    }
  }

  return { today, yesterday: yesterdayGroup, thisWeek, older };
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-1 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
  );
}

function ClearRangePopover({
  onClear,
}: {
  onClear: (startISO?: string, endISO?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  function handleClear() {
    onClear(
      start ? new Date(start).toISOString() : undefined,
      end ? new Date(`${end}T23:59:59`).toISOString() : undefined,
    );
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
          aria-label="Clear history"
        >
          <Icon icon={Delete02Icon} className="size-3.5" />
          Clear
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full max-md:rounded-b-none max-md:!transform-none"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Clear logs</p>
          <p className="text-xs text-muted-foreground">
            Leave both dates empty to clear everything.
          </p>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleClear}
          >
            Delete logs
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const KIND_LABELS: Partial<Record<HistoryActivityKind, string>> = {
  task_created: "Created",
  task_started: "Started",
  task_session: "Stopped",
  task_finished: "Finished",
  task_cancelled: "Cancelled",
  task_restored: "Restored",
  task_deleted: "Deleted",
  task_renamed: "Renamed",
  task_repositioned: "Repositioned",
  task_transferred: "Transferred",
  task_copied: "Copied",
  calendar_connected: "Calendar connected",
  calendar_disconnected: "Calendar disconnected",
  calendar_enabled: "Calendar enabled",
  calendar_disabled: "Calendar disabled",
  calendar_target_changed: "Calendar target changed",
  settings_cursor_enabled: "Cursor enabled",
  settings_cursor_disabled: "Cursor disabled",
  settings_primary_color_changed: "Color changed",
};

function FilterPopover({
  allItems,
  filterTask,
  filterKind,
  filterFrom,
  filterTo,
  onFilterTaskChange,
  onFilterKindChange,
  onFilterFromChange,
  onFilterToChange,
}: {
  allItems: HistoryActivityItem[];
  filterTask: string | null;
  filterKind: HistoryActivityKind | null;
  filterFrom: string;
  filterTo: string;
  onFilterTaskChange: (task: string | null) => void;
  onFilterKindChange: (kind: HistoryActivityKind | null) => void;
  onFilterFromChange: (v: string) => void;
  onFilterToChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const taskLastSeen = new Map<string, string>();
  for (const item of allItems) {
    if (item.taskLabel) {
      const current = taskLastSeen.get(item.taskLabel);
      if (!current || item.createdAt > current) {
        taskLastSeen.set(item.taskLabel, item.createdAt);
      }
    }
  }
  const uniqueTasks = Array.from(taskLastSeen.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([label]) => label);

  const presentKinds = Array.from(new Set(allItems.map((i) => i.kind))).filter(
    (k) => k in KIND_LABELS,
  ) as HistoryActivityKind[];

  const activeCount =
    (filterTask ? 1 : 0) +
    (filterKind ? 1 : 0) +
    (filterFrom || filterTo ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Filter logs"
              className={`relative flex size-7 items-center justify-center rounded-full border transition-colors ${
                activeCount > 0
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon icon={FilterIcon} className="size-3.5" />
              {activeCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-1 ring-background">
                  {activeCount}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filter logs</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-72 space-y-3 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Filters</p>
          {activeCount > 0 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onFilterTaskChange(null);
                onFilterKindChange(null);
                onFilterFromChange("");
                onFilterToChange("");
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {uniqueTasks.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Task
            </p>
            <Select
              value={filterTask ?? "__all__"}
              onValueChange={(v) =>
                onFilterTaskChange(v === "__all__" ? null : v)
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All tasks</SelectItem>
                <SelectSeparator />
                {uniqueTasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {presentKinds.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Type
            </p>
            <Select
              value={filterKind ?? "__all__"}
              onValueChange={(v) =>
                onFilterKindChange(
                  v === "__all__" ? null : (v as HistoryActivityKind),
                )
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                <SelectSeparator />
                {presentKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Time range
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => onFilterFromChange(e.target.value)}
              className="h-7 flex-1 text-xs"
              aria-label="From date"
            />
            <span className="shrink-0 text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => onFilterToChange(e.target.value)}
              className="h-7 flex-1 text-xs"
              aria-label="To date"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function HistoryMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterTask, setFilterTask] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<HistoryActivityKind | null>(
    null,
  );
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const nowMs = useHistoryNowMsEffect();
  const activity = useTODOStore(
    (state) => state.activity,
  ) as HistoryActivityItem[];
  const history = useTODOStore((state) => state.history) as TaskHistoryEntry[];
  const tasks = useTODOStore((state) => state.tasks);
  const clearHistoryRange = useTODOStore((state) => state.clearHistoryRange);
  const deleteActivityItems = useTODOStore(
    (state) => state.deleteActivityItems,
  );

  const allDisplayActivity = buildDisplayActivity(activity, history);

  const filteredActivity = allDisplayActivity.filter((item) => {
    if (filterTask && item.taskLabel !== filterTask) return false;
    if (filterKind && item.kind !== filterKind) return false;
    if (filterFrom && item.createdAt < new Date(filterFrom).toISOString())
      return false;
    if (
      filterTo &&
      item.createdAt > new Date(`${filterTo}T23:59:59`).toISOString()
    )
      return false;
    return true;
  });

  const groups = groupActivity(filteredActivity, nowMs);

  const historyByID = new Map<string, TaskHistoryEntry>(
    history.map((entry: TaskHistoryEntry) => [entry.id, entry]),
  );
  const taskByID = new Map(tasks.map((task) => [task.id, task]));
  const syncedAtByEntryID = buildSyncedAtByEntryID(activity);

  const isEmpty = allDisplayActivity.length === 0;
  const selectionMode = selectedIds.size > 0;
  const allIds = filteredActivity.map((i) => i.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function deleteSelected() {
    deleteActivityItems(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  function exitConfigMode() {
    setConfigMode(false);
    setSelectedIds(new Set());
  }

  if (isEmpty) {
    return (
      <span className="inline-flex cursor-not-allowed-custom">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full squircle squircle-full px-3 opacity-50 hover:bg-transparent"
          disabled
          aria-label="History"
        >
          <Icon icon={NewsIcon} />
          Empty History
        </Button>
      </span>
    );
  }

  function renderGroup(items: HistoryActivityItem[]) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-0.5">
        {items.map((item) => (
          <HistoryActivityLine
            key={item.id}
            item={item}
            nowMs={nowMs}
            historyByID={historyByID}
            taskByID={taskByID}
            syncedAtByEntryID={syncedAtByEntryID}
            configMode={configMode}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            onDelete={() => deleteActivityItems([item.id])}
          />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu
        open={isMenuOpen}
        onOpenChange={(v) => {
          setIsMenuOpen(v);
          if (!v) exitConfigMode();
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full squircle squircle-full hover-hand px-3"
          >
            <Icon icon={NewsIcon} />
            History
            <Icon
              icon={ArrowDown01Icon}
              className={`size-4 transition-transform ${isMenuOpen ? "rotate-180" : "rotate-0"}`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="bottom"
          className="w-[34rem] max-w-[calc(100vw-2rem)] p-0 max-md:fixed max-md:inset-0 max-md:h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:!left-0 max-md:!top-0 max-md:!transform-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {filteredActivity.length < allDisplayActivity.length
                  ? `${filteredActivity.length} of ${allDisplayActivity.length} logs`
                  : `${allDisplayActivity.length} total logs`}
              </span>
              {selectionMode ? (
                <span className="text-xs text-muted-foreground">
                  · {selectedIds.size} selected
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <FilterPopover
                allItems={allDisplayActivity}
                filterTask={filterTask}
                filterKind={filterKind}
                filterFrom={filterFrom}
                filterTo={filterTo}
                onFilterTaskChange={(t) => {
                  setFilterTask(t);
                  setSelectedIds(new Set());
                }}
                onFilterKindChange={(k) => {
                  setFilterKind(k);
                  setSelectedIds(new Set());
                }}
                onFilterFromChange={(v) => {
                  setFilterFrom(v);
                  setSelectedIds(new Set());
                }}
                onFilterToChange={(v) => {
                  setFilterTo(v);
                  setSelectedIds(new Set());
                }}
              />
              {configMode && selectionMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={deleteSelected}
                >
                  <Icon icon={Delete02Icon} className="size-3.5" />
                  Delete {selectedIds.size}
                </Button>
              ) : null}
              {configMode ? (
                <ClearRangePopover
                  onClear={(start, end) => {
                    clearHistoryRange(start, end);
                    exitConfigMode();
                    setIsMenuOpen(false);
                  }}
                />
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={configMode ? "Exit config" : "Config"}
                    onClick={() =>
                      configMode ? exitConfigMode() : setConfigMode(true)
                    }
                    className={`flex size-7 items-center justify-center rounded-full border transition-colors ${
                      configMode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon icon={Settings01Icon} className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {configMode ? "Exit config" : "Config"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Select-all row */}
          {configMode ? (
            <div className="flex items-center gap-2 border-b px-3 py-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={allSelected ? "Deselect all" : "Select all"}
                    onClick={toggleSelectAll}
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      allSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {allSelected ? (
                      <Icon icon={MinusSignIcon} className="size-2.5" />
                    ) : selectionMode ? (
                      <span className="block size-1.5 rounded-full bg-muted-foreground/40" />
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {allSelected ? "Deselect all" : "Select all"}
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">
                {allSelected ? "Deselect all" : "Select all"}
              </span>
            </div>
          ) : null}

          {/* Log list */}
          <div className="max-h-[65vh] overflow-auto p-2 max-md:max-h-[calc(100dvh-4rem)]">
            {filteredActivity.length === 0 && allDisplayActivity.length > 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground/60 select-none">
                No logs match this filter.
              </p>
            )}
            {groups.today.length > 0 && (
              <>
                <SectionLabel label="Today" />
                {renderGroup(groups.today)}
              </>
            )}
            {groups.yesterday.length > 0 && (
              <>
                <SectionLabel label="Yesterday" />
                {renderGroup(groups.yesterday)}
              </>
            )}
            {groups.thisWeek.length > 0 && (
              <>
                <SectionLabel label="This week" />
                {renderGroup(groups.thisWeek)}
              </>
            )}
            {groups.older.length > 0 && (
              <>
                <SectionLabel label="Older" />
                {renderGroup(groups.older)}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
