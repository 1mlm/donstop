"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Delete02Icon,
  Favorite,
  MoreIcon,
  Play,
  StopIcon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useTaskRunningSeconds } from "@/lib/live-task";
import { MOTION_PROPS } from "@/lib/motion";
import { type TaskID, useTODOStore } from "@/lib/store";
import { formatPreviewTime } from "@/lib/util";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import { useTaskDndContext } from "./TaskDndContext";
import TaskList from "./TaskList";
import {
  DropGapIndicator,
  TaskActionsMenu,
  TaskDragPlaceholder,
} from "./task.components";
import {
  useActionsMenuViewportSyncEffect,
  useTaskAutoExpandOnChildrenEffect,
  useTaskCollapseWhileDraggingEffect,
  useTaskEditableFocusEffect,
  useTaskEditValueSyncEffect,
  useTaskTimeoutCleanupEffect,
} from "./task.effects";
import { getTaskDropTargetID, getTaskDurationLabel } from "./task.utils";

const OPEN_ACTIONS_DELAY_MS = 500;
const CLOSE_ACTIONS_DELAY_MS = 150;
const OPEN_ELEMENT_DELAY_MS = 45;
const CLOSE_ELEMENT_DELAY_MS = 120;

function formatDurationInputValue(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseDurationInputValue(raw: string) {
  const value = raw.trim();

  if (value.length === 0) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
  }

  const parts = value.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  if (parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  const [left, middle, right] = parts.map(Number);

  if (parts.length === 2) {
    const minutes = left;
    const seconds = middle;

    if (seconds >= 60) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  const hours = left;
  const minutes = middle;
  const seconds = right;
  if (minutes >= 60 || seconds >= 60) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function clearTimer(timerRef: React.MutableRefObject<number | null>) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function scheduleTimer(
  timerRef: React.MutableRefObject<number | null>,
  delayMs: number,
  callback: () => void,
) {
  clearTimer(timerRef);
  timerRef.current = window.setTimeout(() => {
    callback();
    timerRef.current = null;
  }, delayMs);
}

export function Task({ taskID }: { taskID: TaskID }) {
  // All useState and useRef declarations must come first (no duplicates)
  const [isTaskHovered, setIsTaskHovered] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [elementMenuOpen, setElementMenuOpen] = useState<
    "name" | "time" | null
  >(null);
  const [editMode, setEditMode] = useState<"name" | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState("00:00:00");
  const [timeEditError, setTimeEditError] = useState<string | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const taskHeaderRowRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLSpanElement | null>(null);
  const actionsTriggerRef = useRef<HTMLDivElement | null>(null);
  const openActionsTimeoutRef = useRef<number | null>(null);
  const closeActionsTimeoutRef = useRef<number | null>(null);
  const openElementTimeoutRef = useRef<number | null>(null);
  const closeElementTimeoutRef = useRef<number | null>(null);

  // Close actions menu on outside tap (mobile)
  useEffect(() => {
    if (!actionsMenuOpen) return;
    // Only activate on touch devices
    if (
      typeof window === "undefined" ||
      (!("ontouchstart" in window) && !(navigator.maxTouchPoints > 0))
    )
      return;

    function handlePointerDown(e: PointerEvent) {
      // If click is inside the menu or trigger, do nothing
      const menu = document.querySelector(".fixed.z-\\[9999\\]");
      if (menu?.contains(e.target as Node)) return;
      if (actionsTriggerRef.current?.contains(e.target as Node)) return;
      setActionsMenuOpen(false);
      setElementMenuOpen(null);
    }
    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
    };
  }, [actionsMenuOpen]);
  const expanded = useTODOStore((s) => s.taskExpanded[taskID] ?? false);
  const setTaskExpanded = useTODOStore((s) => s.setTaskExpanded);
  const setExpanded = (val: boolean | ((prev: boolean) => boolean)) => {
    setTaskExpanded(taskID, typeof val === "function" ? val(expanded) : val);
  };

  const startTask = useTODOStore((state) => state.startTask);
  const stopActiveTask = useTODOStore((state) => state.stopActiveTask);
  const finishActiveTask = useTODOStore((state) => state.finishActiveTask);
  const resetActiveTaskDuration = useTODOStore(
    (state) => state.resetActiveTaskDuration,
  );
  const cancelActiveTask = useTODOStore((state) => state.cancelActiveTask);
  const transferActiveTaskTime = useTODOStore(
    (state) => state.transferActiveTaskTime,
  );
  const toggleFavorite = useTODOStore((state) => state.toggleFavorite);
  const finishTask = useTODOStore((state) => state.finishTask);
  const restoreTask = useTODOStore((state) => state.restoreTask);
  const resetTaskDuration = useTODOStore((state) => state.resetTaskDuration);
  const setTaskDuration = useTODOStore((state) => state.setTaskDuration);
  const renameTask = useTODOStore((state) => state.renameTask);
  const deleteTask = useTODOStore((state) => state.deleteTask);
  const logTaskCopied = useTODOStore((state) => state.logTaskCopied);
  const hasActiveChildRecursive = useTODOStore(
    (state) => state.hasActiveChildRecursive,
  );
  const task = useTODOStore((state) => state.getTaskFromID(taskID));
  const childrenIDs = useTODOStore(
    useShallow((state) => state.getTaskChildrenIDs(taskID)),
  );
  const isActive = useTODOStore(
    (state) => state.activeSession?.taskId === taskID,
  );
  const activeTaskID = useTODOStore((state) => state.activeSession?.taskId);
  const runningSeconds = useTaskRunningSeconds(taskID);
  const isParent = childrenIDs.length > 0;
  const isFinished = task?.isFinished ?? false;
  const isFavorite = task?.isFavorite ?? false;
  const taskLabel = task?.label ?? "";
  const taskStoredSeconds = task?.time ?? 0;
  const hasActiveChild = hasActiveChildRecursive(taskID);
  const { draggingTaskID, draggingDescendantIDs } = useTaskDndContext();
  const shouldShowRowControls =
    (!draggingTaskID && isTaskHovered) ||
    actionsMenuOpen ||
    elementMenuOpen !== null;
  const isAnyMenuOpen = actionsMenuOpen || elementMenuOpen !== null;
  const prevChildrenCountRef = useRef(childrenIDs.length);

  // No need to sync to Map; state is now persisted in store

  useTaskAutoExpandOnChildrenEffect({
    childrenCount: childrenIDs.length,
    expanded,
    setExpanded,
    prevChildrenCountRef,
  });

  const isDescendantTarget = useMemo(
    () => Boolean(draggingTaskID) && draggingDescendantIDs.has(taskID),
    [draggingTaskID, draggingDescendantIDs, taskID],
  );

  const isDropDisabled = draggingTaskID === taskID || isDescendantTarget;
  const showDropTargets = Boolean(draggingTaskID) && !isDropDisabled;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: taskID,
    disabled: editMode !== null || isTimePopoverOpen,
  });

  const isSourceOfActiveDrag = draggingTaskID === taskID;
  const isRowBeingDragged = isDragging || isSourceOfActiveDrag;

  const { setNodeRef: setDropBeforeNodeRef, isOver: isOverBefore } =
    useDroppable({
      id: getTaskDropTargetID(taskID, "before"),
      disabled: isDropDisabled,
    });
  const { setNodeRef: setDropAfterNodeRef, isOver: isOverAfter } = useDroppable(
    {
      id: getTaskDropTargetID(taskID, "after"),
      disabled: isDropDisabled,
    },
  );
  const { setNodeRef: setDropInsideNodeRef, isOver: isOverInside } =
    useDroppable({
      id: getTaskDropTargetID(taskID, "inside"),
      disabled: isDropDisabled,
    });

  const showBeforeGap = showDropTargets && isOverBefore;
  const showAfterGap = showDropTargets && isOverAfter;

  const draggableStyle = {
    transform: isRowBeingDragged
      ? undefined
      : CSS.Translate.toString(transform),
    opacity: 1,
  };

  useTaskCollapseWhileDraggingEffect();

  useTaskEditValueSyncEffect({ taskLabel, setEditValue: setEditNameValue });

  useTaskEditableFocusEffect({
    isEditing: editMode === "name",
    taskLabel,
    editInputRef,
  });

  useTaskTimeoutCleanupEffect([
    openActionsTimeoutRef,
    closeActionsTimeoutRef,
    openElementTimeoutRef,
    closeElementTimeoutRef,
  ]);

  useEffect(() => {
    if (!isTaskHovered || isAnyMenuOpen || isRowBeingDragged) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rowNode = taskHeaderRowRef.current;
      const eventTarget = event.target;

      if (!(eventTarget instanceof Node) || !rowNode) {
        return;
      }

      if (!rowNode.contains(eventTarget)) {
        setIsTaskHovered(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [isTaskHovered, isAnyMenuOpen, isRowBeingDragged]);

  const closeMenus = () => {
    setActionsMenuOpen(false);
    setElementMenuOpen(null);
    setIsTaskHovered(false);
  };

  const updateActionsMenuPosition = useCallback(() => {
    const trigger = actionsTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setActionsMenuPos({ left: rect.left, top: rect.bottom + 2 });
  }, []);

  const scheduleOpenActionsMenu = () => {
    if (actionsMenuOpen) {
      return;
    }

    clearTimer(closeActionsTimeoutRef);
    scheduleTimer(openActionsTimeoutRef, OPEN_ACTIONS_DELAY_MS, () => {
      updateActionsMenuPosition();
      setActionsMenuOpen(true);
    });
  };

  const toggleActionsMenu = () => {
    clearTimer(openActionsTimeoutRef);
    clearTimer(closeActionsTimeoutRef);
    updateActionsMenuPosition();
    setActionsMenuOpen((previous) => {
      const next = !previous;

      if (!next) {
        setElementMenuOpen(null);
      }

      return next;
    });
  };

  const scheduleCloseActionsMenu = () => {
    clearTimer(openActionsTimeoutRef);
    scheduleTimer(closeActionsTimeoutRef, CLOSE_ACTIONS_DELAY_MS, () => {
      setActionsMenuOpen(false);
      setElementMenuOpen(null);
    });
  };

  const scheduleOpenElementMenu = (key: "name" | "time") => {
    clearTimer(closeElementTimeoutRef);
    scheduleTimer(openElementTimeoutRef, OPEN_ELEMENT_DELAY_MS, () => {
      updateActionsMenuPosition();
      setElementMenuOpen(key);
    });
  };

  const scheduleCloseElementMenu = () => {
    clearTimer(openElementTimeoutRef);
    scheduleTimer(closeElementTimeoutRef, CLOSE_ELEMENT_DELAY_MS, () => {
      setElementMenuOpen(null);
    });
  };

  const toggleExpanded = () => {
    if (!isParent || isRowBeingDragged) {
      return;
    }
    setExpanded((previous) => !previous);
  };

  const handleTransfer = () => {
    if (activeTaskID && activeTaskID !== taskID) {
      transferActiveTaskTime(taskID);
      closeMenus();
    }
  };

  const copyTaskValue = async (value: string, target: "id" | "name" | null) => {
    try {
      await navigator.clipboard.writeText(value);
      if (target) {
        logTaskCopied(taskID, target);
      }
      setElementMenuOpen(null);
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  const commitRename = () => {
    renameTask(taskID, editNameValue);
    setEditMode(null);
  };

  const commitTimeEdit = () => {
    const parsed = parseDurationInputValue(editTimeValue);

    if (parsed === null) {
      setTimeEditError("Use ss, mm:ss, or hh:mm:ss");
      return;
    }

    setTaskDuration(taskID, parsed);
    setTimeEditError(null);
    setIsTimePopoverOpen(false);
  };

  useActionsMenuViewportSyncEffect({
    actionsMenuOpen,
    updateActionsMenuPosition,
  });

  const tryDeleteTask = () => {
    const didDelete = deleteTask(taskID);
    if (didDelete) {
      closeMenus();
    }
  };

  if (!task) return null;

  const taskDurationLabel = getTaskDurationLabel({
    isActive,
    storedSeconds: task.time,
    runningSeconds,
  });
  const isInsideDropActive = showDropTargets && isOverInside && !isDragging;
  const activeTaskPaddingClass = isInsideDropActive
    ? "py-2 px-2 pr-2.5"
    : "py-0.5 px-2 pr-2.5";
  const finishedTaskPaddingClass = isInsideDropActive
    ? "py-1.5 px-1"
    : "p-0.5 px-1";

  if (isFinished) {
    return (
      <TooltipProvider>
        <div
          className={`relative flex flex-col overflow-visible transition-[padding] duration-150 ease-out ${
            showBeforeGap ? "pt-2" : "pt-0"
          } ${showAfterGap ? "pb-2" : "pb-0"}`}
        >
          {!isRowBeingDragged ? (
            <DropGapIndicator
              setNodeRef={setDropBeforeNodeRef}
              isActive={showDropTargets && isOverBefore}
              position="top"
            />
          ) : null}

          <div
            ref={(node) => {
              setDraggableNodeRef(node);
              setDropInsideNodeRef(node);
            }}
            style={draggableStyle}
            {...attributes}
            {...listeners}
            className={`group flex items-center gap-1 select-none transition-[padding,opacity,filter] duration-200 ${
              isInsideDropActive ? "py-1.5" : "py-0.5"
            } ${isRowBeingDragged ? "cursor-grabbing-custom" : "cursor-grab-custom"}`}
          >
            {isRowBeingDragged ? (
              <TaskDragPlaceholder compact />
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => restoreTask(taskID)}
                      className="w-0 overflow-hidden opacity-0 transition-all duration-100 group-hover:w-4 group-hover:opacity-100 hover:text-primary"
                      aria-label="Restore finished task"
                    >
                      <Icon icon={UndoIcon} className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Restore</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => deleteTask(taskID)}
                      className="w-0 overflow-hidden opacity-0 transition-all duration-100 group-hover:w-4 group-hover:opacity-100 hover:text-destructive"
                      aria-label="Delete finished task"
                    >
                      <Icon icon={Delete02Icon} className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Delete</TooltipContent>
                </Tooltip>

                <span className="relative inline-flex w-fit max-w-full items-center gap-1">
                  <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/35" />
                  <span className="truncate text-xs text-muted-foreground">
                    {taskLabel}
                  </span>
                  {task.time > 0 && (
                    <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground/80">
                      {formatPreviewTime(task.time)}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          <DropGapIndicator
            setNodeRef={setDropAfterNodeRef}
            isActive={showDropTargets && isOverAfter}
            position="bottom"
          />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={`relative flex flex-col overflow-visible transition-[padding] duration-150 ease-out ${
          showBeforeGap ? "pt-2" : "pt-0"
        } ${showAfterGap ? "pb-2" : "pb-0"}`}
      >
        {!isRowBeingDragged ? (
          <DropGapIndicator
            setNodeRef={setDropBeforeNodeRef}
            isActive={showDropTargets && isOverBefore}
            position="top"
          />
        ) : null}

        <div
          ref={setDraggableNodeRef}
          style={{ ...draggableStyle, touchAction: "none" }}
          {...attributes}
          {...listeners}
          className={`flex flex-col
        relative
        isolate
        ${isAnyMenuOpen ? "z-[200]" : "z-0 hover:z-30"}
        select-none
          transition-[padding,transform,opacity,filter,border-color,background-color,color,box-shadow]
        duration-300 ease-out
        border
        rounded-2xl squircle squircle-2xl
          ${isFinished ? finishedTaskPaddingClass : activeTaskPaddingClass}
        ${isParent && expanded && "rounded-tl-md pb-1"}
        ${
          isActive
            ? "bg-primary/50 text-primary-foreground shadow-lg font-semibold"
            : isFinished
              ? "bg-muted border-dashed opacity-60"
              : "bg-primary/5 hover:bg-primary/7 hover:border-primary/25"
        }
        ${isOverInside ? "border-primary/55 bg-primary/8" : ""}
        ${isRowBeingDragged ? "border-border/50 bg-muted/20" : ""}
        ${isRowBeingDragged ? "cursor-grabbing-custom" : "cursor-grab-custom"}`}
        >
          {!isRowBeingDragged && isFavorite && (
            <div className="absolute -top-2 -right-1 z-10 rotate-12">
              <Icon
                icon={Favorite}
                className={`size-5 text-primary fill-primary drop-shadow-sm
              duration-300
              hover:animate-ping hover:-translate-x-2 hover:translate-y-2`}
              />
            </div>
          )}

          {isRowBeingDragged ? (
            <TaskDragPlaceholder />
          ) : (
            <>
              <div
                ref={(node) => {
                  taskHeaderRowRef.current = node;
                  setDropInsideNodeRef(node);
                }}
                onPointerEnter={() => {
                  // On PC, hovering shows controls, but not during drag
                  if (
                    !isRowBeingDragged &&
                    typeof window !== "undefined" &&
                    !("ontouchstart" in window || navigator.maxTouchPoints > 0)
                  ) {
                    setIsTaskHovered(true);
                  }
                }}
                onPointerLeave={() => {
                  if (!isRowBeingDragged && !isAnyMenuOpen) {
                    setIsTaskHovered(false);
                  }
                }}
                onClick={() => {
                  // On PC: click toggles expand/collapse, but not during drag
                  if (
                    typeof window !== "undefined" &&
                    !("ontouchstart" in window || navigator.maxTouchPoints > 0)
                  ) {
                    if (isParent && !isRowBeingDragged) toggleExpanded();
                  }
                }}
                onTouchEnd={(e) => {
                  // On mobile: touch shows menu/controls, but not if chevron was touched
                  if (
                    typeof window !== "undefined" &&
                    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
                  ) {
                    // If chevron was touched, do nothing (chevron handles expand/collapse)
                    const chevron = e.currentTarget.querySelector(
                      "[data-task-chevron]",
                    );
                    if (
                      chevron &&
                      e.target instanceof Node &&
                      chevron.contains(e.target)
                    ) {
                      return;
                    }
                    // Otherwise, show row controls and open group menu
                    setIsTaskHovered(true);
                    updateActionsMenuPosition();
                    setActionsMenuOpen(true);
                  }
                }}
                className={`flex items-center justify-between text-ellipsis transition-colors duration-250 ease-out ${isParent && expanded && "pb-1"}`}
              >
                <div
                  className={`flex shrink-0 overflow-visible transition-[width,margin-right] duration-180 ease-out ${
                    shouldShowRowControls ? "mr-1 w-[50px]" : "mr-0 w-0"
                  }`}
                >
                  <div
                    className={`flex items-center gap-0.5 origin-left transition-[opacity,transform] duration-180 ease-out ${
                      shouldShowRowControls
                        ? "translate-x-0 scale-100 opacity-100"
                        : "-translate-x-1 scale-95 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div
                      className="relative"
                      ref={actionsTriggerRef}
                      onMouseEnter={scheduleOpenActionsMenu}
                      onMouseLeave={scheduleCloseActionsMenu}
                    >
                      <button
                        className="rounded squircle squircle-lg bg-transparent p-1 transition-colors hover:bg-primary/15"
                        aria-label="Task group options"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          // On mobile, don't close menu right after opening
                          toggleActionsMenu();
                        }}
                      >
                        <Icon icon={MoreIcon} className="size-4" />
                      </button>

                      <TaskActionsMenu
                        open={actionsMenuOpen}
                        position={actionsMenuPos}
                        taskID={taskID}
                        isActive={isActive}
                        activeTaskID={activeTaskID}
                        isFavorite={isFavorite}
                        elementMenuOpen={elementMenuOpen}
                        onMouseEnterMenu={scheduleOpenActionsMenu}
                        onMouseLeaveMenu={scheduleCloseActionsMenu}
                        onMouseEnterName={() => scheduleOpenElementMenu("name")}
                        onMouseLeaveName={scheduleCloseElementMenu}
                        onMouseEnterTime={() => scheduleOpenElementMenu("time")}
                        onMouseLeaveTime={scheduleCloseElementMenu}
                        onStartEditName={() => {
                          setEditNameValue(taskLabel);
                          setEditMode("name");
                          closeMenus();
                        }}
                        onStartEditTime={() => {
                          setEditTimeValue(
                            formatDurationInputValue(taskStoredSeconds),
                          );
                          setTimeEditError(null);
                          setIsTimePopoverOpen(true);
                          closeMenus();
                        }}
                        onTransfer={handleTransfer}
                        onFinishActive={() => {
                          finishActiveTask();
                          closeMenus();
                        }}
                        onResetActiveDuration={() => {
                          resetActiveTaskDuration();
                          closeMenus();
                        }}
                        onCancelActive={() => {
                          cancelActiveTask(true);
                          closeMenus();
                        }}
                        onFinishTask={() => {
                          finishTask(taskID);
                          closeMenus();
                        }}
                        onResetTaskDuration={() => {
                          resetTaskDuration(taskID);
                          closeMenus();
                        }}
                        onToggleFavorite={() => toggleFavorite(taskID)}
                        onDelete={tryDeleteTask}
                        onCopyName={() => copyTaskValue(taskLabel, "name")}
                        onCopyTime={() =>
                          copyTaskValue(String(taskStoredSeconds), null)
                        }
                      />
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="rounded squircle squircle-lg bg-transparent p-1 transition-colors hover:bg-primary/15"
                          onClick={() => {
                            if (isActive) {
                              stopActiveTask();
                              // Only close menu on desktop
                              if (
                                typeof window !== "undefined" &&
                                !(
                                  "ontouchstart" in window ||
                                  navigator.maxTouchPoints > 0
                                )
                              ) {
                                if (actionsMenuOpen || elementMenuOpen !== null)
                                  setActionsMenuOpen(false);
                              }
                              return;
                            }

                            startTask(taskID);
                            // Only close menu on desktop
                            if (
                              typeof window !== "undefined" &&
                              !(
                                "ontouchstart" in window ||
                                navigator.maxTouchPoints > 0
                              )
                            ) {
                              if (actionsMenuOpen || elementMenuOpen !== null)
                                setActionsMenuOpen(false);
                            }
                          }}
                          aria-label={isActive ? "Stop task" : "Start task"}
                        >
                          <Icon
                            icon={isActive ? StopIcon : Play}
                            className="size-4"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {isActive ? "Stop task" : "Start task"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <span className="w-full truncate pl-0.5 text-left">
                  {isFinished && <span className="mr-1">• • • •</span>}
                  {editMode === "name" ? (
                    <span
                      ref={editInputRef}
                      contentEditable
                      suppressContentEditableWarning
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onInput={(event) => {
                        setEditNameValue(event.currentTarget.textContent ?? "");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitRename();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          setEditNameValue(taskLabel);
                          setEditMode(null);
                        }
                      }}
                      onBlur={() => {
                        commitRename();
                      }}
                      className="inline-block max-w-full min-w-12 rounded-md border-b border-border/60 bg-transparent px-1 text-sm font-medium text-foreground outline-none"
                    />
                  ) : (
                    taskLabel
                  )}
                  <Popover
                    open={isTimePopoverOpen}
                    onOpenChange={(nextOpen) => {
                      if (nextOpen) {
                        setEditTimeValue(
                          formatDurationInputValue(taskStoredSeconds),
                        );
                        setTimeEditError(null);
                      }

                      setIsTimePopoverOpen(nextOpen);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="pl-1 text-xs text-primary-foreground/50 rounded-md transition-colors hover:text-primary-foreground/80"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        aria-label="Edit task duration"
                      >
                        {taskDurationLabel}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-64"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <Input
                          id={`task-duration-${taskID}`}
                          autoFocus
                          value={editTimeValue}
                          onChange={(event) => {
                            setEditTimeValue(event.target.value);
                            if (timeEditError) {
                              setTimeEditError(null);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitTimeEdit();
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              setIsTimePopoverOpen(false);
                              setTimeEditError(null);
                            }
                          }}
                          placeholder="hh:mm:ss"
                          aria-label="Task duration"
                          style={{
                            width: `${Math.max(6, editTimeValue.length)}ch`,
                            minWidth: 60,
                            maxWidth: 120,
                          }}
                          className="text-sm px-2 py-1 rounded border border-input bg-transparent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={commitTimeEdit}
                          className="ml-1"
                        >
                          Save
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepts ss, mm:ss, or hh:mm:ss
                        </p>
                        {timeEditError ? (
                          <p className="text-xs text-destructive mt-1">
                            {timeEditError}
                          </p>
                        ) : null}
                      </div>
                    </PopoverContent>
                  </Popover>
                </span>

                {isParent && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isRowBeingDragged) toggleExpanded();
                        }}
                        data-task-chevron
                        className="relative p-1 rounded squircle squircle-lg transition-colors shrink-0"
                        aria-label={
                          expanded ? "Collapse subtasks" : "Expand subtasks"
                        }
                      >
                        <Icon
                          icon={ChevronDown}
                          className={`duration-75 ${expanded ? "-scale-125" : "scale-125"}`}
                        />
                        {hasActiveChild && (
                          <span className="absolute bottom-0.5 right-0.5 size-2 rounded-full bg-primary border border-background" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {expanded ? "Collapse subtasks" : "Expand subtasks"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <AnimatePresence>
                {isParent && expanded && !isRowBeingDragged && (
                  <motion.div
                    {...MOTION_PROPS}
                    className="flex flex-col pl-3 gap-1"
                  >
                    <TaskList taskIDs={childrenIDs} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className={`pointer-events-none absolute inset-x-1.5 inset-y-1 rounded-xl border border-dashed transition-all duration-200 ease-out ${
                  isOverInside
                    ? "border-primary/65 bg-primary/8 opacity-100"
                    : "border-transparent bg-transparent opacity-0"
                }`}
              >
                <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 rounded-full bg-primary/55" />
              </div>
            </>
          )}
        </div>

        {!isRowBeingDragged ? (
          <DropGapIndicator
            setNodeRef={setDropAfterNodeRef}
            isActive={showDropTargets && isOverAfter}
            position="bottom"
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
