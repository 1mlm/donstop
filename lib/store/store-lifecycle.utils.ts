import type { ActiveTaskSession, HistoryActivityItem, TaskObj } from "../types";

export function getSafeElapsedSeconds(
  startedAt: string,
  endTimeMs = Date.now(),
) {
  const startedAtMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endTimeMs - startedAtMs) / 1000));
}

export function computeFinishActiveTaskState(
  currentTasks: TaskObj[],
  activeSession: ActiveTaskSession | null,
  endTimeMs = Date.now(),
): {
  nextTasks: TaskObj[];
  activityItem: HistoryActivityItem;
  taskLabel: string;
  durationSeconds: number;
} | null {
  if (!activeSession) {
    return null;
  }

  const task = currentTasks.find((item) => item.id === activeSession.taskId);

  if (!task) {
    return null;
  }

  const durationSeconds = getSafeElapsedSeconds(
    activeSession.startedAt,
    endTimeMs,
  );
  const finishedAt = new Date(endTimeMs).toISOString();

  return {
    nextTasks: currentTasks.map((item) =>
      item.id === activeSession.taskId
        ? { ...item, isFinished: true, finishedAt, isFavorite: false }
        : item,
    ),
    activityItem: {
      id: `task-finished-${Date.now()}`,
      kind: "task_finished",
      createdAt: finishedAt,
      taskLabel: task.label,
      taskHistoryEntryID: activeSession.taskId,
      durationSeconds,
    },
    taskLabel: task.label,
    durationSeconds,
  };
}

export function computeCancelActiveTaskState(
  currentTasks: TaskObj[],
  activeSession: ActiveTaskSession | null,
  endTimeMs = Date.now(),
): {
  activityItem: HistoryActivityItem;
  taskLabel: string;
  durationSeconds: number;
} | null {
  if (!activeSession) {
    return null;
  }

  const task = currentTasks.find((item) => item.id === activeSession.taskId);

  if (!task) {
    return null;
  }

  const durationSeconds = getSafeElapsedSeconds(
    activeSession.startedAt,
    endTimeMs,
  );
  const cancelledAt = new Date(endTimeMs).toISOString();

  return {
    activityItem: {
      id: `task-cancelled-${Date.now()}`,
      kind: "task_cancelled",
      createdAt: cancelledAt,
      taskLabel: task.label,
      taskHistoryEntryID: activeSession.taskId,
      durationSeconds,
    },
    taskLabel: task.label,
    durationSeconds,
  };
}
