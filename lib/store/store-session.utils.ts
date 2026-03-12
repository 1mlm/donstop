export type SessionLike = {
  taskId: string;
  startedAt: string;
};

export type TransferTaskLike = {
  id: string;
  label: string;
};

export type TransferComputationResult = {
  nextActiveSession: SessionLike;
  sourceTaskLabel: string;
  targetTaskLabel: string;
  durationSeconds: number;
};

export function computeTransferActiveSession(
  activeSession: SessionLike | null,
  tasks: TransferTaskLike[],
  targetTaskID: string,
  nowMs = Date.now(),
): TransferComputationResult | null {
  if (!activeSession) {
    return null;
  }

  const sourceTask = tasks.find((task) => task.id === activeSession.taskId);
  const targetTask = tasks.find((task) => task.id === targetTaskID);

  if (!sourceTask || !targetTask) {
    return null;
  }

  const startedAtMs = new Date(activeSession.startedAt).getTime();
  const safeStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : nowMs;
  const durationSeconds = Math.max(
    0,
    Math.floor((nowMs - safeStartedAtMs) / 1000),
  );

  return {
    nextActiveSession: {
      taskId: targetTaskID,
      startedAt: activeSession.startedAt,
    },
    sourceTaskLabel: sourceTask.label,
    targetTaskLabel: targetTask.label,
    durationSeconds,
  };
}

export type TaskWithTime = {
  id: string;
  time: number;
};

export function resetTaskDurationInList<T extends TaskWithTime>(
  tasks: T[],
  taskID: string,
): T[] {
  return tasks.map((task) =>
    task.id === taskID ? { ...task, time: 0 } : task,
  );
}

export function resetActiveSessionStart(
  activeSession: SessionLike | null,
  nowIso = new Date().toISOString(),
): SessionLike | null {
  if (!activeSession) {
    return null;
  }

  return {
    taskId: activeSession.taskId,
    startedAt: nowIso,
  };
}
