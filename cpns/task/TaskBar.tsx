import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ChevronDown,
  MoreIcon,
  Play,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import { type TaskID, useTODOStore } from "@/lib/store";
import { formatPreviewTime } from "@/lib/util";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Bar } from "../Bar";
import { Icon } from "../Icon";
import { TaskDndProvider } from "./TaskDndContext";
import TaskList from "./TaskList";

export default function TaskBar() {
  const rootTaskIDs = useTODOStore(
    useShallow((state) => state.getRootTaskIDs()),
  );
  const createTask = useTODOStore((state) => state.createTask);
  const moveTask = useTODOStore((state) => state.moveTask);
  const getTaskFromID = useTODOStore((state) => state.getTaskFromID);
  const getTaskChildrenIDs = useTODOStore((state) => state.getTaskChildrenIDs);
  const [draggingTaskID, setDraggingTaskID] = useState<TaskID | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const canSubmitNewTask = newTaskLabel.trim().length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const draggingTask = draggingTaskID ? getTaskFromID(draggingTaskID) : null;
  const draggingTaskChildrenCount = draggingTaskID
    ? getTaskChildrenIDs(draggingTaskID).length
    : 0;

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
    setDraggingTaskID(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTaskID(null);

    const sourceTaskID = String(event.active.id);
    const overID = event.over ? String(event.over.id) : "";
    const dropTargets = [
      { prefix: "drop-before:", placement: "before" as const },
      { prefix: "drop-after:", placement: "after" as const },
      { prefix: "drop-inside:", placement: "inside" as const },
    ];

    const matchedDropTarget = dropTargets.find(({ prefix }) =>
      overID.startsWith(prefix),
    );

    if (!matchedDropTarget) {
      return;
    }

    const targetTaskID = overID.replace(matchedDropTarget.prefix, "");
    moveTask(sourceTaskID, targetTaskID, matchedDropTarget.placement);
  };

  const handleTaskInputClick = () => {
    if (canSubmitNewTask) {
      submitNewTask();
    }
  };

  return (
    <TaskDndProvider value={{ draggingTaskID }}>
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingTaskID(null)}
      >
        <Bar className="p-3 overflow-y-auto gap-1">
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

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {draggingTask ? (
            <div className="pointer-events-none min-w-56 rounded-2xl squircle squircle-2xl border border-white/70 bg-primary/92 px-2 py-0.5 pr-2.5 text-primary-foreground backdrop-blur-[1px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex shrink-0 items-center gap-0.5 opacity-85">
                  <span className="rounded squircle squircle-lg p-1">
                    <Icon icon={MoreIcon} className="size-4" />
                  </span>
                  <span className="rounded squircle squircle-lg p-1">
                    <Icon icon={Play} className="size-4" />
                  </span>
                </div>

                <span className="min-w-0 flex-1 truncate pl-0.5 text-left text-sm font-medium">
                  {draggingTask.label}
                  <span className="pl-1 text-xs text-primary-foreground/60">
                    {formatPreviewTime(draggingTask.time)}
                  </span>
                </span>

                {draggingTaskChildrenCount > 0 ? (
                  <span className="shrink-0 rounded squircle squircle-lg p-1 opacity-90">
                    <Icon icon={ChevronDown} className="size-4 scale-125" />
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </TaskDndProvider>
  );
}
