import { z } from "zod";
import type {
  ActiveTaskSession,
  HistoryActivityItem,
  TaskHistoryEntry,
  TaskObj,
} from "../types";
import { getElapsedSeconds } from "../util";

export const TODO_STORE_STORAGE_KEY = "todo-app-store";

function readMinTrackedTaskDurationSeconds() {
  const rawValue = process.env.NEXT_PUBLIC_MIN_TASK_SECONDS;
  const parsedValue = Number(rawValue);

  if (Number.isFinite(parsedValue) && parsedValue >= 0) {
    return parsedValue;
  }

  return 5 * 60;
}

export const MIN_TRACKED_TASK_DURATION_SECONDS =
  readMinTrackedTaskDurationSeconds();

export type TaskID = TaskObj["id"];

export type PersistedTODOState = {
  tasks: TaskObj[];
  activeSession: ActiveTaskSession | null;
  history: TaskHistoryEntry[];
  activity: HistoryActivityItem[];
};

const taskObjSchema = z.object({
  id: z.string(),
  label: z.string(),
  parentId: z.string().optional(),
  position: z.number(),
  time: z.number(),
  isFinished: z.boolean().optional(),
  finishedAt: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

const activeTaskSessionSchema = z
  .object({
    taskId: z.string(),
    startedAt: z.string(),
  })
  .nullable();

const taskHistoryEntrySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  taskLabel: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
  durationSeconds: z.number(),
  calendarSyncStatus: z.enum(["pending", "synced", "failed", "deleted"]),
  calendarEventId: z.string().optional(),
  syncedCalendarId: z.string().optional(),
  syncedCalendarName: z.string().optional(),
  calendarDeletedAt: z.string().optional(),
});

const historyActivityItemSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "task_created",
    "task_session",
    "task_started",
    "task_transferred",
    "task_finished",
    "task_restored",
    "task_cancelled",
    "task_renamed",
    "task_deleted",
    "task_copied",
    "calendar_synced",
    "calendar_sync_failed",
  ]),
  createdAt: z.string(),
  taskLabel: z.string(),
  taskHistoryEntryID: z.string(),
  durationSeconds: z.number().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  oldLabel: z.string().optional(),
  newLabel: z.string().optional(),
  sourceTaskLabel: z.string().optional(),
  copyTarget: z.enum(["id", "name"]).optional(),
});

const persistedTodoStateSchema = z.object({
  tasks: z.array(taskObjSchema),
  activeSession: activeTaskSessionSchema,
  history: z.array(taskHistoryEntrySchema),
  activity: z.array(historyActivityItemSchema),
});

export function sortByPosition(left: TaskObj, right: TaskObj) {
  return left.position - right.position;
}

export function createDefaultState(tasks: TaskObj[]): PersistedTODOState {
  return {
    tasks,
    activeSession: null,
    history: [],
    activity: [],
  };
}

export function validatePersistedState(
  input: unknown,
  tasks: TaskObj[],
): { state: PersistedTODOState; isValid: boolean } {
  const result = persistedTodoStateSchema.safeParse(input);

  if (result.success) {
    return {
      state: result.data,
      isValid: true,
    };
  }

  return {
    state: createDefaultState(tasks),
    isValid: false,
  };
}

export function completeActiveSession(
  tasks: TaskObj[],
  activeSession: ActiveTaskSession | null,
  endTimeMs = Date.now(),
) {
  if (!activeSession) {
    return null;
  }

  const activeTask = tasks.find((task) => task.id === activeSession.taskId);

  if (!activeTask) {
    return null;
  }

  const durationSeconds = getElapsedSeconds(activeSession.startedAt, endTimeMs);

  if (durationSeconds < MIN_TRACKED_TASK_DURATION_SECONDS) {
    return {
      completedSession: null,
      nextTasks: tasks,
    };
  }

  const endedAt = new Date(endTimeMs).toISOString();

  const completedSession: TaskHistoryEntry = {
    id: crypto.randomUUID(),
    taskId: activeTask.id,
    taskLabel: activeTask.label,
    startedAt: activeSession.startedAt,
    endedAt,
    durationSeconds,
    calendarSyncStatus: "pending",
  };

  const nextTasks = tasks.map((task) =>
    task.id === activeTask.id
      ? { ...task, time: task.time + durationSeconds }
      : task,
  );

  return {
    completedSession,
    nextTasks,
  };
}

export function createTaskSessionActivity(
  taskHistoryEntry: TaskHistoryEntry,
): HistoryActivityItem {
  return {
    id: crypto.randomUUID(),
    kind: "task_session",
    createdAt: taskHistoryEntry.endedAt,
    taskLabel: taskHistoryEntry.taskLabel,
    taskHistoryEntryID: taskHistoryEntry.id,
    durationSeconds: taskHistoryEntry.durationSeconds,
    startedAt: taskHistoryEntry.startedAt,
    endedAt: taskHistoryEntry.endedAt,
  };
}

export function createCalendarActivity(
  kind: "calendar_synced" | "calendar_sync_failed",
  taskHistoryEntry: TaskHistoryEntry,
): HistoryActivityItem {
  return {
    id: crypto.randomUUID(),
    kind,
    createdAt: new Date().toISOString(),
    taskLabel: taskHistoryEntry.taskLabel,
    taskHistoryEntryID: taskHistoryEntry.id,
  };
}
