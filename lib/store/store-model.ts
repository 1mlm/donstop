import { z } from "zod";
import type {
  ActiveTaskSession,
  HistoryActivityItem,
  TaskHistoryEntry,
  TaskObj,
} from "../types";
import { generateRandomID, getElapsedSeconds } from "../util";

export const TODO_STORE_STORAGE_KEY = "todo-app-store";

export type TaskID = TaskObj["id"];

export type PersistedTODOState = {
  tasks: TaskObj[];
  deletedTasks: TaskObj[];
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
    "task_repositioned",
    "task_finished",
    "task_restored",
    "task_cancelled",
    "task_renamed",
    "task_deleted",
    "task_copied",
    "calendar_synced",
    "calendar_sync_failed",
    "calendar_connected",
    "calendar_disconnected",
    "calendar_enabled",
    "calendar_disabled",
    "calendar_target_changed",
    "settings_cursor_enabled",
    "settings_cursor_disabled",
    "settings_primary_color_changed",
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
  moveDestinationParentLabel: z.string().optional(),
  moveBeforeTaskLabel: z.string().optional(),
  moveAfterTaskLabel: z.string().optional(),
  subjectLabel: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
});

const persistedTodoStateSchema = z.object({
  tasks: z.array(taskObjSchema),
  deletedTasks: z.array(taskObjSchema).optional(),
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
    deletedTasks: [],
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
    // Patch: If deletedTasks is missing, default to []
    const state = {
      ...result.data,
      deletedTasks: result.data.deletedTasks ?? [],
    };
    return {
      state,
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

  const endedAt = new Date(endTimeMs).toISOString();

  const completedSession: TaskHistoryEntry = {
    id: generateRandomID(),
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
    id: generateRandomID(),
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
    id: generateRandomID(),
    kind,
    createdAt: new Date().toISOString(),
    taskLabel: taskHistoryEntry.taskLabel,
    taskHistoryEntryID: taskHistoryEntry.id,
  };
}
