import type { TaskObj } from "@/lib/types";
import { formatPreviewTime } from "@/lib/util";

export const TASK_DROP_TARGET_PREFIX = {
  before: "drop-before:",
  after: "drop-after:",
  inside: "drop-inside:",
} as const;

const TASK_DROP_TARGETS = [
  {
    prefix: TASK_DROP_TARGET_PREFIX.before,
    placement: "before" as const,
  },
  {
    prefix: TASK_DROP_TARGET_PREFIX.after,
    placement: "after" as const,
  },
  {
    prefix: TASK_DROP_TARGET_PREFIX.inside,
    placement: "inside" as const,
  },
];

type DropPlacement = (typeof TASK_DROP_TARGETS)[number]["placement"];

type Point2D = {
  x: number;
  y: number;
};

type RectBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function getTaskDropTargetID(taskID: string, placement: DropPlacement) {
  return `${TASK_DROP_TARGET_PREFIX[placement]}${taskID}`;
}

export function isEdgeDropContainerID(containerID: string) {
  return (
    containerID.startsWith(TASK_DROP_TARGET_PREFIX.before) ||
    containerID.startsWith(TASK_DROP_TARGET_PREFIX.after)
  );
}

export function isPointerInsideBounds(pointer: Point2D, bounds: RectBounds) {
  return (
    pointer.x >= bounds.left &&
    pointer.x <= bounds.right &&
    pointer.y >= bounds.top &&
    pointer.y <= bounds.bottom
  );
}

export function isPointerInBottomSnapZone({
  pointer,
  bounds,
  horizontalPadding,
  bottomPadding,
}: {
  pointer: Point2D;
  bounds: RectBounds;
  horizontalPadding: number;
  bottomPadding: number;
}) {
  return (
    pointer.x >= bounds.left - horizontalPadding &&
    pointer.x <= bounds.right + horizontalPadding &&
    pointer.y > bounds.bottom &&
    pointer.y <= bounds.bottom + bottomPadding
  );
}

export function isDescendantDropTarget({
  allTasks,
  draggingTaskID,
  taskID,
}: {
  allTasks: TaskObj[];
  draggingTaskID: string | null;
  taskID: string;
}) {
  if (!draggingTaskID || draggingTaskID === taskID) {
    return false;
  }

  const descendantsOfDragging = new Set<string>();
  const stack = [draggingTaskID];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const directChildren = allTasks
      .filter((item) => item.parentId === current)
      .map((item) => item.id);

    for (const childID of directChildren) {
      if (!descendantsOfDragging.has(childID)) {
        descendantsOfDragging.add(childID);
        stack.push(childID);
      }
    }
  }

  return descendantsOfDragging.has(taskID);
}

export function getDescendantsOfTask(
  allTasks: TaskObj[],
  rootTaskID: string | null,
) {
  const descendants = new Set<string>();

  if (!rootTaskID) {
    return descendants;
  }

  const stack = [rootTaskID];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const item of allTasks) {
      if (item.parentId !== current) {
        continue;
      }

      if (descendants.has(item.id)) {
        continue;
      }

      descendants.add(item.id);
      stack.push(item.id);
    }
  }

  return descendants;
}

export function getTaskDurationLabel({
  isActive,
  storedSeconds,
  runningSeconds,
}: {
  isActive: boolean;
  storedSeconds: number;
  runningSeconds: number;
}) {
  if (!isActive) {
    return formatPreviewTime(storedSeconds);
  }

  return `${formatPreviewTime(storedSeconds) ?? "0s"} + ${formatPreviewTime(runningSeconds) ?? "0s"}`;
}

export function parseTaskDropTarget(overID: string) {
  const matchedDropTarget = TASK_DROP_TARGETS.find(({ prefix }) =>
    overID.startsWith(prefix),
  );

  if (!matchedDropTarget) {
    return null;
  }

  return {
    placement: matchedDropTarget.placement,
    targetTaskID: overID.replace(matchedDropTarget.prefix, ""),
  };
}
