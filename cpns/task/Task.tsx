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
  useActionsMenuViewportSyncEffect,
  useTaskAutoExpandOnChildrenEffect,
  useTaskCollapseWhileDraggingEffect,
  useTaskEditableFocusEffect,
  useTaskEditValueSyncEffect,
  useTaskTimeoutCleanupEffect,
} from "./task.effects";
import {
  DropGapIndicator,
  TaskActionsMenu,
  TaskDragPlaceholder,
} from "./task.components";
import { getTaskDropTargetID, getTaskDurationLabel } from "./task.utils";

const taskExpandedState = new Map<TaskID, boolean>();
const OPEN_ACTIONS_DELAY_MS = 35;
const CLOSE_ACTIONS_DELAY_MS = 150;
const OPEN_COPY_DELAY_MS = 45;
const CLOSE_COPY_DELAY_MS = 120;

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
  const [expanded, setExpanded] = useState(
    () => taskExpandedState.get(taskID) ?? false,
  );
  const [isTaskHovered, setIsTaskHovered] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [actionsMenuPos, setActionsMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const editInputRef = useRef<HTMLSpanElement | null>(null);
  const actionsTriggerRef = useRef<HTMLDivElement | null>(null);
  const openActionsTimeoutRef = useRef<number | null>(null);
  const closeActionsTimeoutRef = useRef<number | null>(null);
  const openCopyTimeoutRef = useRef<number | null>(null);
  const closeCopyTimeoutRef = useRef<number | null>(null);

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
  const hasActiveChild = hasActiveChildRecursive(taskID);
  const { draggingTaskID, draggingDescendantIDs } = useTaskDndContext();
  const shouldShowRowControls =
    (!draggingTaskID && isTaskHovered) || actionsMenuOpen || copyMenuOpen;
  const isAnyMenuOpen = actionsMenuOpen || copyMenuOpen;
  const prevChildrenCountRef = useRef(childrenIDs.length);

  useEffect(() => {
    taskExpandedState.set(taskID, expanded);
  }, [taskID, expanded]);

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
    disabled: isEditing,
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

  useTaskCollapseWhileDraggingEffect({
    draggingTaskID,
    taskID,
    expanded,
    setExpanded,
  });

  useTaskEditValueSyncEffect({ taskLabel, setEditValue });

  useTaskEditableFocusEffect({
    isEditing,
    taskLabel,
    editInputRef,
  });

  useTaskTimeoutCleanupEffect([
    openActionsTimeoutRef,
    closeActionsTimeoutRef,
    openCopyTimeoutRef,
    closeCopyTimeoutRef,
  ]);

  const closeMenus = () => {
    setActionsMenuOpen(false);
    setCopyMenuOpen(false);
    setIsTaskHovered(false);
  };

  const updateActionsMenuPosition = useCallback(() => {
    const trigger = actionsTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setActionsMenuPos({ left: rect.left, top: rect.bottom + 2 });
  }, []);

  const scheduleOpenActionsMenu = () => {
    clearTimer(closeActionsTimeoutRef);
    scheduleTimer(openActionsTimeoutRef, OPEN_ACTIONS_DELAY_MS, () => {
      updateActionsMenuPosition();
      setActionsMenuOpen(true);
    });
  };

  const scheduleCloseActionsMenu = () => {
    clearTimer(openActionsTimeoutRef);
    scheduleTimer(closeActionsTimeoutRef, CLOSE_ACTIONS_DELAY_MS, () => {
      setActionsMenuOpen(false);
      setCopyMenuOpen(false);
      setIsTaskHovered(false);
    });
  };

  const scheduleOpenCopyMenu = () => {
    clearTimer(closeCopyTimeoutRef);
    scheduleTimer(openCopyTimeoutRef, OPEN_COPY_DELAY_MS, () => {
      updateActionsMenuPosition();
      setCopyMenuOpen(true);
    });
  };

  const scheduleCloseCopyMenu = () => {
    clearTimer(openCopyTimeoutRef);
    scheduleTimer(closeCopyTimeoutRef, CLOSE_COPY_DELAY_MS, () => {
      setCopyMenuOpen(false);
    });
  };

  const toggleExpanded = () => {
    if (!isParent) {
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

  const copyTaskValue = async (value: string, target: "id" | "name") => {
    try {
      await navigator.clipboard.writeText(value);
      logTaskCopied(taskID, target);
      setCopyMenuOpen(false);
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  const commitRename = () => {
    renameTask(taskID, editValue);
    setIsEditing(false);
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
          style={draggableStyle}
          {...attributes}
          {...listeners}
          onPointerEnter={() => setIsTaskHovered(true)}
          onPointerLeave={() => {
            if (!isAnyMenuOpen) {
              setIsTaskHovered(false);
            }
          }}
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
        ${expanded && "rounded-tl-md pb-1"}
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
                ref={setDropInsideNodeRef}
                className={`flex items-center justify-between text-ellipsis transition-colors duration-250 ease-out ${expanded && "pb-1"}`}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="rounded squircle squircle-lg bg-transparent p-1 transition-colors hover:bg-primary/15"
                            aria-label="Task actions"
                          >
                            <Icon icon={MoreIcon} className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Task actions</TooltipContent>
                      </Tooltip>

                      <TaskActionsMenu
                        open={actionsMenuOpen}
                        position={actionsMenuPos}
                        taskID={taskID}
                        isActive={isActive}
                        activeTaskID={activeTaskID}
                        isFavorite={isFavorite}
                        copyMenuOpen={copyMenuOpen}
                        onMouseEnterMenu={scheduleOpenActionsMenu}
                        onMouseLeaveMenu={scheduleCloseActionsMenu}
                        onMouseEnterCopy={scheduleOpenCopyMenu}
                        onMouseLeaveCopy={scheduleCloseCopyMenu}
                        onToggleCopy={() => setCopyMenuOpen((prev) => !prev)}
                        onStartEdit={() => {
                          setEditValue(taskLabel);
                          setIsEditing(true);
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
                          cancelActiveTask(false);
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
                        onCopyID={() => copyTaskValue(task.id, "id")}
                        onCopyName={() => copyTaskValue(taskLabel, "name")}
                      />
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="rounded squircle squircle-lg bg-transparent p-1 transition-colors hover:bg-primary/15"
                          onClick={() => {
                            if (isActive) {
                              stopActiveTask();
                              closeMenus();
                              return;
                            }

                            startTask(taskID);
                            closeMenus();
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

                <span
                  className="w-full truncate pl-0.5 text-left"
                  onClick={toggleExpanded}
                >
                  {isFinished && <span className="mr-1">• • • •</span>}
                  {isEditing ? (
                    <span
                      ref={editInputRef}
                      contentEditable
                      suppressContentEditableWarning
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onInput={(event) => {
                        setEditValue(event.currentTarget.textContent ?? "");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitRename();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          setEditValue(taskLabel);
                          setIsEditing(false);
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
                  <span className="pl-1 text-xs text-primary-foreground/50">
                    {taskDurationLabel}
                  </span>
                </span>

                {isParent && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleExpanded}
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
                {isParent && expanded && (
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
