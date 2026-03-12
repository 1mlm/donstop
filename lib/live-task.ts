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

export function useActiveTaskSummary() {
  const activeSession = useTODOStore((state) => state.activeSession);
  const tasks = useTODOStore((state) => state.tasks);
  const activeTask = useTODOStore((state) =>
    activeSession ? state.getTaskFromID(activeSession.taskId) : null,
  );
  const runningSeconds = useRunningSeconds(activeSession?.startedAt);

  if (!activeSession || !activeTask) {
    return null;
  }

  const tasksByID = new Map(tasks.map((task) => [task.id, task]));
  const parentPath: Array<{ id: string; label: string; key: string }> = [];
  let currentParentID = activeTask.parentId;

  while (currentParentID) {
    const parentTask = tasksByID.get(currentParentID);

    if (!parentTask) {
      break;
    }

    const prevKey = parentPath[0]?.key;
    const nextKey = prevKey ? `${parentTask.id}/${prevKey}` : parentTask.id;

    parentPath.unshift({
      id: parentTask.id,
      label: parentTask.label,
      key: nextKey,
    });
    currentParentID = parentTask.parentId;
  }

  return {
    activeTask,
    storedSeconds: activeTask.time,
    runningSeconds,
    elapsedSeconds: activeTask.time + runningSeconds,
    parentPath,
  };
}
