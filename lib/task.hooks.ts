"use client";

import { useEffect, useState } from "react";
import { type TaskID, useTODOStore } from "./store";
import { getElapsedSeconds } from "./util";

function useRunningSeconds(startedAt?: string) {
  const [runningSeconds, setRunningSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setRunningSeconds(0);
      return;
    }

    const startTimeMs = new Date(startedAt).getTime();

    if (!Number.isFinite(startTimeMs)) {
      setRunningSeconds(0);
      return;
    }

    const updateRunningSeconds = () => {
      setRunningSeconds(getElapsedSeconds(startedAt, Date.now()));
    };

    updateRunningSeconds();

    const intervalID = window.setInterval(updateRunningSeconds, 1000);

    return () => window.clearInterval(intervalID);
  }, [startedAt]);

  return runningSeconds;
}

export function useTaskElapsedSeconds(taskID: TaskID) {
  const task = useTODOStore((state) => state.getTaskFromID(taskID));
  const activeSession = useTODOStore((state) =>
    state.activeSession?.taskId === taskID ? state.activeSession : null,
  );
  const runningSeconds = useRunningSeconds(activeSession?.startedAt);

  if (!task) {
    return null;
  }

  return task.time + runningSeconds;
}

export function useTaskRunningSeconds(taskID: TaskID) {
  const activeSession = useTODOStore((state) =>
    state.activeSession?.taskId === taskID ? state.activeSession : null,
  );

  return useRunningSeconds(activeSession?.startedAt);
}

export function useTaskRunningSecondsThrottled(taskID: TaskID) {
  const activeSession = useTODOStore((state) =>
    state.activeSession?.taskId === taskID ? state.activeSession : null,
  );
  const startedAt = activeSession?.startedAt;
  const [runningSeconds, setRunningSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setRunningSeconds(0);
      return;
    }
    const update = () =>
      setRunningSeconds(getElapsedSeconds(startedAt, Date.now()));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return runningSeconds;
}

export function useActiveTaskSummary() {
  const activeSession = useTODOStore((state) => state.activeSession);
  const activeTask = useTODOStore((state) =>
    activeSession ? state.getTaskFromID(activeSession.taskId) : null,
  );
  const runningSeconds = useRunningSeconds(activeSession?.startedAt);

  if (!activeSession || !activeTask) {
    return null;
  }

  return {
    activeTask,
    storedSeconds: activeTask.time,
    runningSeconds,
    elapsedSeconds: activeTask.time + runningSeconds,
    parentPath: [] as Array<{ id: string; label: string; key: string }>,
  };
}
