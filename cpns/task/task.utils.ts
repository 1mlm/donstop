import type { TaskObj } from "@/lib/types";
import { formatPreviewTime } from "@/lib/util";

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

export function getSiblingIDs(allTasks: TaskObj[], parentId?: string) {
  return allTasks
    .filter((item) => item.parentId === parentId)
    .sort((left, right) => left.position - right.position)
    .map((item) => item.id);
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
