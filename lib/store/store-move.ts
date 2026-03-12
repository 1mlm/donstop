import type { TaskObj } from "../types";

type TaskID = TaskObj["id"];

function sortByPosition(left: TaskObj, right: TaskObj) {
  return left.position - right.position;
}

export type TaskMovePlacement = "before" | "after" | "inside";

export type TaskMovePlan = {
  oldParentID: TaskObj["parentId"];
  destinationParentID: TaskObj["parentId"];
  destinationPositionByID: Map<TaskID, number>;
  previousSiblingPositionByID: Map<TaskID, number> | null;
  movedTaskBefore?: string;
  movedTaskAfter?: string;
  destinationParentLabel?: string;
};

export function computeTaskMovePlan(
  currentTasks: TaskObj[],
  movingTask: TaskObj,
  targetTask: TaskObj,
  placement: TaskMovePlacement,
): TaskMovePlan | null {
  const oldParentID = movingTask.parentId;
  const destinationParentID =
    placement === "inside" ? targetTask.id : targetTask.parentId;

  const destinationSiblings = currentTasks
    .filter(
      (item) =>
        item.parentId === destinationParentID && item.id !== movingTask.id,
    )
    .sort(sortByPosition);

  const targetIndex =
    placement === "inside"
      ? 0
      : destinationSiblings.findIndex((item) => item.id === targetTask.id);

  if (placement !== "inside" && targetIndex < 0) {
    return null;
  }

  const insertIndex =
    placement === "before"
      ? targetIndex
      : placement === "after"
        ? targetIndex + 1
        : targetIndex;

  const reorderedDestination = [...destinationSiblings];
  reorderedDestination.splice(insertIndex, 0, {
    ...movingTask,
    parentId: destinationParentID,
  });

  if (oldParentID === destinationParentID) {
    const currentOrder = currentTasks
      .filter((item) => item.parentId === oldParentID)
      .sort(sortByPosition)
      .map((item) => item.id);
    const nextOrder = reorderedDestination.map((item) => item.id);

    const didChangeOrder =
      currentOrder.length !== nextOrder.length ||
      currentOrder.some((id, index) => nextOrder[index] !== id);

    if (!didChangeOrder) {
      return null;
    }
  }

  const destinationPositionByID = new Map(
    reorderedDestination.map((item, index) => [item.id, index]),
  );

  const movedTaskIndex = reorderedDestination.findIndex(
    (item) => item.id === movingTask.id,
  );

  const movedTaskBefore =
    movedTaskIndex > 0
      ? reorderedDestination[movedTaskIndex - 1]?.label
      : undefined;
  const movedTaskAfter =
    movedTaskIndex >= 0 && movedTaskIndex < reorderedDestination.length - 1
      ? reorderedDestination[movedTaskIndex + 1]?.label
      : undefined;
  const destinationParentLabel = destinationParentID
    ? currentTasks.find((item) => item.id === destinationParentID)?.label
    : undefined;

  const previousSiblingPositionByID =
    oldParentID !== destinationParentID
      ? new Map(
          currentTasks
            .filter(
              (item) =>
                item.parentId === oldParentID && item.id !== movingTask.id,
            )
            .sort(sortByPosition)
            .map((item, index) => [item.id, index]),
        )
      : null;

  return {
    oldParentID,
    destinationParentID,
    destinationPositionByID,
    previousSiblingPositionByID,
    movedTaskBefore,
    movedTaskAfter,
    destinationParentLabel,
  };
}

export function applyTaskMovePlan(tasks: TaskObj[], movePlan: TaskMovePlan) {
  return tasks.map((item) => {
    const destinationPosition = movePlan.destinationPositionByID.get(item.id);
    if (destinationPosition !== undefined) {
      return {
        ...item,
        parentId: movePlan.destinationParentID,
        position: destinationPosition,
      };
    }

    const previousSiblingPosition = movePlan.previousSiblingPositionByID?.get(
      item.id,
    );
    if (previousSiblingPosition !== undefined) {
      return {
        ...item,
        parentId: movePlan.oldParentID,
        position: previousSiblingPosition,
      };
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
    moveDestinationParentLabel: movePlan.destinationParentLabel,
    moveBeforeTaskLabel: movePlan.movedTaskBefore,
    moveAfterTaskLabel: movePlan.movedTaskAfter,
  };
}
