import type { TaskObj } from "../types";

type TaskID = TaskObj["id"];

function sortByPosition(left: TaskObj, right: TaskObj) {
  return left.position - right.position;
}

export type TaskMovePlacement = "before" | "after";

export type TaskMovePlan = {
  destinationPositionByID: Map<TaskID, number>;
  movedTaskBefore?: string;
  movedTaskAfter?: string;
};

export function computeTaskMovePlan(
  currentTasks: TaskObj[],
  movingTask: TaskObj,
  targetTask: TaskObj,
  placement: TaskMovePlacement,
): TaskMovePlan | null {
  const activeSiblings = currentTasks
    .filter((item) => !item.isFinished && item.id !== movingTask.id)
    .sort(sortByPosition);

  const targetIndex = activeSiblings.findIndex(
    (item) => item.id === targetTask.id,
  );

  if (targetIndex < 0) {
    return null;
  }

  const insertIndex =
    placement === "before" ? targetIndex : targetIndex + 1;

  const reordered = [...activeSiblings];
  reordered.splice(insertIndex, 0, movingTask);

  const currentOrder = currentTasks
    .filter((t) => !t.isFinished)
    .sort(sortByPosition)
    .map((t) => t.id);
  const nextOrder = reordered.map((t) => t.id);

  const didChangeOrder =
    currentOrder.length !== nextOrder.length ||
    currentOrder.some((id, index) => nextOrder[index] !== id);

  if (!didChangeOrder) {
    return null;
  }

  const destinationPositionByID = new Map(
    reordered.map((item, index) => [item.id, index]),
  );

  const movedIdx = reordered.findIndex((t) => t.id === movingTask.id);
  const movedTaskBefore =
    movedIdx > 0 ? reordered[movedIdx - 1]?.label : undefined;
  const movedTaskAfter =
    movedIdx < reordered.length - 1
      ? reordered[movedIdx + 1]?.label
      : undefined;

  return { destinationPositionByID, movedTaskBefore, movedTaskAfter };
}

export function applyTaskMovePlan(tasks: TaskObj[], movePlan: TaskMovePlan) {
  return tasks.map((item) => {
    const pos = movePlan.destinationPositionByID.get(item.id);
    if (pos !== undefined) {
      return { ...item, position: pos };
    }
    return item;
  });
}

export function createTaskRepositionActivity(
  taskID: TaskID,
  taskLabel: string,
  movePlan: TaskMovePlan,
) {
  return {
    id: `task-repositioned-${Date.now()}`,
    kind: "task_repositioned" as const,
    createdAt: new Date().toISOString(),
    taskLabel,
    taskHistoryEntryID: taskID,
    moveBeforeTaskLabel: movePlan.movedTaskBefore,
    moveAfterTaskLabel: movePlan.movedTaskAfter,
  };
}
