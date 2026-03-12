import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { type TaskID, useTODOStore } from "@/lib/store";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Bar } from "../Bar";
import { Icon } from "../Icon";
import { TaskDndProvider } from "./TaskDndContext";
import { TaskDragOverlayCard } from "./TaskDragOverlayCard";
import TaskList from "./TaskList";
import {
  getDescendantsOfTask,
  isEdgeDropContainerID,
  isPointerInBottomSnapZone,
  isPointerInsideBounds,
  parseTaskDropTarget,
} from "./task.utils";

const BOTTOM_END_DROP_SNAP_PX = 220;
const HORIZONTAL_END_DROP_SNAP_PX = 80;

function isBottomEndSnapDrop({
  bounds,
  pointer,
}: {
  bounds: DOMRect;
  pointer: { x: number; y: number };
}) {
  return isPointerInBottomSnapZone({
    pointer,
    bounds,
    horizontalPadding: HORIZONTAL_END_DROP_SNAP_PX,
    bottomPadding: BOTTOM_END_DROP_SNAP_PX,
  });
}

export default function TaskBar() {
  const taskDropAreaRef = useRef<HTMLDivElement | null>(null);
  const lastPointerCoordinatesRef = useRef<{ x: number; y: number } | null>(
    null,
  );
  const isPointerWithinDropAreaRef = useRef(true);
  const pointerWithinDropAreaRafRef = useRef<number | null>(null);
  const nextPointerWithinDropAreaValueRef = useRef(true);
  const rootTaskIDs = useTODOStore(
    useShallow((state) => state.getRootTaskIDs()),
  );
  const createTask = useTODOStore((state) => state.createTask);
  const moveTask = useTODOStore((state) => state.moveTask);
  const getTaskFromID = useTODOStore((state) => state.getTaskFromID);
  const getTaskChildrenIDs = useTODOStore((state) => state.getTaskChildrenIDs);
  const allTasks = useTODOStore((state) => state.tasks);
  const [draggingTaskID, setDraggingTaskID] = useState<TaskID | null>(null);
  const [isPointerWithinDropArea, setIsPointerWithinDropArea] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const canSubmitNewTask = newTaskLabel.trim().length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
  );

  const draggingTask = draggingTaskID ? getTaskFromID(draggingTaskID) : null;
  const draggingTaskChildrenCount = draggingTaskID
    ? getTaskChildrenIDs(draggingTaskID).length
    : 0;
  const draggingDescendantIDs = useMemo(
    () => getDescendantsOfTask(allTasks, draggingTaskID),
    [allTasks, draggingTaskID],
  );
  const dndContextValue = useMemo(
    () => ({ draggingTaskID, draggingDescendantIDs }),
    [draggingTaskID, draggingDescendantIDs],
  );

  useEffect(() => {
    if (draggingTaskID) {
      document.body.classList.add("task-dragging");
    } else {
      document.body.classList.remove("task-dragging");
    }

    return () => {
      document.body.classList.remove("task-dragging");
    };
  }, [draggingTaskID]);

  useEffect(() => {
    return () => {
      if (pointerWithinDropAreaRafRef.current !== null) {
        window.cancelAnimationFrame(pointerWithinDropAreaRafRef.current);
        pointerWithinDropAreaRafRef.current = null;
      }
    };
  }, []);

  const schedulePointerWithinDropAreaUpdate = useCallback(
    (nextValue: boolean) => {
      nextPointerWithinDropAreaValueRef.current = nextValue;

      if (pointerWithinDropAreaRafRef.current !== null) {
        return;
      }

      pointerWithinDropAreaRafRef.current = window.requestAnimationFrame(() => {
        pointerWithinDropAreaRafRef.current = null;
        setIsPointerWithinDropArea(nextPointerWithinDropAreaValueRef.current);
      });
    },
    [],
  );

  const boundedCollisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const bounds = taskDropAreaRef.current?.getBoundingClientRect();
      const pointer = args.pointerCoordinates;

      if (!bounds || !pointer) {
        return closestCenter(args);
      }

      lastPointerCoordinatesRef.current = { x: pointer.x, y: pointer.y };

      const isPointerInsideStrictBounds = isPointerInsideBounds(
        pointer,
        bounds,
      );

      const canSnapToEndOutsideBottom = isBottomEndSnapDrop({
        bounds,
        pointer,
      });

      const isPointerWithinDropArea =
        isPointerInsideStrictBounds || canSnapToEndOutsideBottom;

      if (isPointerWithinDropAreaRef.current !== isPointerWithinDropArea) {
        isPointerWithinDropAreaRef.current = isPointerWithinDropArea;
        schedulePointerWithinDropAreaUpdate(isPointerWithinDropArea);
      }

      if (!isPointerInsideStrictBounds) {
        return [];
      }

      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }

      const edgeDropContainers = args.droppableContainers.filter(
        (container) => {
          return isEdgeDropContainerID(String(container.id));
        },
      );

      if (edgeDropContainers.length > 0) {
        const edgeCollisions = closestCenter({
          ...args,
          droppableContainers: edgeDropContainers,
        });

        if (edgeCollisions.length > 0) {
          return edgeCollisions;
        }
      }

      // Fallback keeps drop feeling forgiving when pointer is near slim drop rails.
      return closestCenter(args);
    },
    [schedulePointerWithinDropAreaUpdate],
  );

  const submitNewTask = useCallback(() => {
    const label = newTaskLabel.trim();
    if (!label) {
      return;
    }

    const createdTaskID = createTask(label);
    if (!createdTaskID) {
      return;
    }

    setNewTaskLabel("");
  }, [createTask, newTaskLabel]);

  const handleDragStart = (event: DragStartEvent) => {
    if (pointerWithinDropAreaRafRef.current !== null) {
      window.cancelAnimationFrame(pointerWithinDropAreaRafRef.current);
      pointerWithinDropAreaRafRef.current = null;
    }

    lastPointerCoordinatesRef.current = null;
    isPointerWithinDropAreaRef.current = true;
    nextPointerWithinDropAreaValueRef.current = true;
    setIsPointerWithinDropArea(true);
    setDraggingTaskID(String(event.active.id));
  };

  const finalizeDrag = () => {
    if (pointerWithinDropAreaRafRef.current !== null) {
      window.cancelAnimationFrame(pointerWithinDropAreaRafRef.current);
      pointerWithinDropAreaRafRef.current = null;
    }

    isPointerWithinDropAreaRef.current = true;
    nextPointerWithinDropAreaValueRef.current = true;
    setIsPointerWithinDropArea(true);
    setDraggingTaskID(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const sourceTaskID = String(event.active.id);
    const overID = event.over ? String(event.over.id) : "";
    const dropTarget = parseTaskDropTarget(overID);

    if (!dropTarget) {
      const bounds = taskDropAreaRef.current?.getBoundingClientRect();
      const pointer = lastPointerCoordinatesRef.current;
      const lastRootTaskID = rootTaskIDs.at(-1);
      const shouldSnapToListEnd = Boolean(
        bounds &&
          pointer &&
          lastRootTaskID &&
          isBottomEndSnapDrop({ bounds, pointer }),
      );

      if (
        shouldSnapToListEnd &&
        lastRootTaskID &&
        lastRootTaskID !== sourceTaskID
      ) {
        moveTask(sourceTaskID, lastRootTaskID, "after");
      }

      finalizeDrag();
      return;
    }

    moveTask(sourceTaskID, dropTarget.targetTaskID, dropTarget.placement);
    finalizeDrag();
  };

  const handleTaskInputClick = () => {
    if (canSubmitNewTask) {
      submitNewTask();
    }
  };

  return (
    <TaskDndProvider value={dndContextValue}>
      <DndContext
        collisionDetection={boundedCollisionDetection}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={finalizeDrag}
      >
        <Bar ref={taskDropAreaRef} className="p-3 overflow-y-auto gap-1">
          <div className="mb-1">
            <InputGroup className="h-9 rounded-2xl squircle squircle-2xl border-dashed border-border/75 bg-muted/18 transition-colors focus-within:border-primary/50 focus-within:bg-background/70">
              <InputGroupAddon
                align="inline-start"
                className="pl-1.5 pr-1 [&>button]:ml-0"
              >
                <InputGroupButton
                  size="icon-sm"
                  aria-label="Create task"
                  onClick={submitNewTask}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Icon icon={PlusSignIcon} className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>

              <InputGroupInput
                value={newTaskLabel}
                onChange={(event) => setNewTaskLabel(event.target.value)}
                onClick={handleTaskInputClick}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitNewTask();
                  }
                }}
                placeholder="Create a task..."
                className="text-sm"
              />
            </InputGroup>
          </div>

          <TaskList taskIDs={rootTaskIDs} />
        </Bar>

        <DragOverlay dropAnimation={null}>
          {draggingTask ? (
            <TaskDragOverlayCard
              label={draggingTask.label}
              storedSeconds={draggingTask.time}
              childrenCount={draggingTaskChildrenCount}
              isInvalidDrop={!isPointerWithinDropArea}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </TaskDndProvider>
  );
}
