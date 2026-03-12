"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { TaskID } from "@/lib/store";

type TaskDndContextValue = {
  draggingTaskID: TaskID | null;
  draggingDescendantIDs: Set<TaskID>;
};

const TaskDndContext = createContext<TaskDndContextValue>({
  draggingTaskID: null,
  draggingDescendantIDs: new Set<TaskID>(),
});

export function TaskDndProvider({
  value,
  children,
}: {
  value: TaskDndContextValue;
  children: ReactNode;
}) {
  return (
    <TaskDndContext.Provider value={value}>{children}</TaskDndContext.Provider>
  );
}

export function useTaskDndContext() {
  return useContext(TaskDndContext);
}
