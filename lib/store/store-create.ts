import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createFakeHistoryData, createFakeTasks, createFakeTags } from "../fake";
import type { TagObj, TaskObj } from "../types";
import { generateRandomID } from "../util";
import {
  computeCancelActiveTaskState,
  computeFinishActiveTaskState,
} from "./store-lifecycle.utils";
import {
  completeActiveSession,
  createCalendarActivity,
  createDefaultState,
  createTaskSessionActivity,
  sortByPosition,
  type TagID,
  type TaskID,
  TODO_STORE_STORAGE_KEY,
  validatePersistedState,
} from "./store-model";
import {
  applyTaskMovePlan,
  computeTaskMovePlan,
  createTaskRepositionActivity,
  type TaskMovePlacement,
} from "./store-move";
import {
  computeTransferActiveSession,
  resetActiveSessionStart,
  resetTaskDurationInList,
} from "./store-session.utils";

export type TODOStoreState = ReturnType<typeof createDefaultState> & {
  needsDataReset: boolean;
  activeTagFilter: TagID | null;
  createTask: (label: string) => TaskID | null;
  startTask: (taskID: TaskID) => void;
  stopActiveTask: () => void;
  finishActiveTask: () => void;
  resetActiveTaskDuration: () => void;
  finishTask: (taskID: TaskID) => void;
  restoreTask: (taskID: TaskID) => void;
  resetTaskDuration: (taskID: TaskID) => void;
  setTaskDuration: (taskID: TaskID, durationSeconds: number) => boolean;
  populateFakeData: () => boolean;
  cancelActiveTask: (skipConfirmation?: boolean) => boolean;
  transferActiveTaskTime: (targetTaskID: TaskID) => void;
  toggleFavorite: (taskID: TaskID) => void;
  renameTask: (taskID: TaskID, newLabel: string) => boolean;
  moveTask: (taskID: TaskID, targetTaskID: TaskID, placement: TaskMovePlacement) => boolean;
  deleteTask: (taskID: TaskID) => boolean;
  restoreDeletedTask: (taskID: TaskID) => boolean;
  deletedTasks: TaskObj[];
  clearTrash: () => void;
  logTaskCopied: (taskID: TaskID, target: "id" | "name") => void;
  resetAllData: () => void;
  wipeAllData: () => void;
  clearHistory: () => void;
  clearHistoryRange: (startISO?: string, endISO?: string) => void;
  addActivityNote: (activityId: string, text: string) => void;
  deleteActivityNote: (activityId: string, noteId: string) => void;
  deleteActivityItems: (ids: string[]) => void;
  markHistoryEntrySynced: (historyEntryID: string, calendarEventId: string, syncedCalendarId: string, syncedCalendarName: string) => void;
  markHistoryEntryFailed: (historyEntryID: string) => void;
  markHistoryEntriesDeleted: (historyEntryIDs: string[]) => void;
  logCalendarConnected: (subjectLabel?: string) => void;
  logCalendarDisconnected: (subjectLabel?: string) => void;
  logCalendarSyncEnabled: (subjectLabel?: string) => void;
  logCalendarSyncDisabled: (subjectLabel?: string) => void;
  logCalendarTargetChanged: (previousCalendarName: string, nextCalendarName: string) => void;
  logSettingsCursorEnabled: () => void;
  logSettingsCursorDisabled: () => void;
  logSettingsPrimaryColorChanged: (previousColor: string, nextColor: string) => void;
  getRootTaskIDs: () => TaskID[];
  getTaskFromID: (taskID: TaskID) => TaskObj | null;
  getTagFromID: (tagId: TagID) => TagObj | null;
  createTag: (name: string, icon: string) => TagID;
  deleteTag: (tagId: TagID) => void;
  renameTag: (tagId: TagID, name: string) => void;
  assignTagToTask: (taskID: TaskID, tagId: TagID) => void;
  removeTagFromTask: (taskID: TaskID, tagId: TagID) => void;
  setActiveTagFilter: (tagId: TagID | null) => void;
  dismissDataReset: () => void;
};

function isLegacySeededFakeState(state: ReturnType<typeof createDefaultState>) {
  if (state.activeSession !== null) return false;
  if (state.history.length > 0 || state.activity.length > 0) return false;
  const generatedFakeTasks = createFakeTasks();
  if (state.tasks.length !== generatedFakeTasks.length) return false;
  const fakeTaskIDs = new Set(generatedFakeTasks.map((task) => task.id));
  return state.tasks.every((task) => fakeTaskIDs.has(task.id));
}

export const createTODOStoreBase = (tasks: TaskObj[]) =>
  create<TODOStoreState>()(
    persist(
      (set, get) => ({
        ...createDefaultState(tasks),
        deletedTasks: [],
        needsDataReset: false,
        activeTagFilter: null,

        setActiveTagFilter(tagId) {
          set({ activeTagFilter: tagId });
        },

        dismissDataReset() {
          get().resetAllData();
          set({ needsDataReset: false });
        },

        createTag(name, icon) {
          const tagId = generateRandomID();
          set((state) => ({
            tags: [...state.tags, { id: tagId, name: name.trim(), icon }],
          }));
          return tagId;
        },

        deleteTag(tagId) {
          set((state) => ({
            tags: state.tags.filter((t) => t.id !== tagId),
            tasks: state.tasks.map((t) =>
              t.tagIds?.includes(tagId)
                ? { ...t, tagIds: t.tagIds.filter((id) => id !== tagId) }
                : t,
            ),
          }));
        },

        renameTag(tagId, name) {
          const trimmed = name.trim();
          if (!trimmed) return;
          set((state) => ({
            tags: state.tags.map((t) =>
              t.id === tagId ? { ...t, name: trimmed } : t,
            ),
          }));
        },

        assignTagToTask(taskID, tagId) {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskID && !t.tagIds?.includes(tagId)
                ? { ...t, tagIds: [...(t.tagIds ?? []), tagId] }
                : t,
            ),
          }));
        },

        removeTagFromTask(taskID, tagId) {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskID
                ? { ...t, tagIds: (t.tagIds ?? []).filter((id) => id !== tagId) }
                : t,
            ),
          }));
        },

        getTagFromID(tagId) {
          return get().tags.find((t) => t.id === tagId) ?? null;
        },

        createTask(label) {
          const trimmed = label.trim();
          if (!trimmed) return null;

          const taskID = generateRandomID();
          const createdAt = new Date().toISOString();
          const activeTagFilter = get().activeTagFilter;

          set((state) => ({
            tasks: [
              ...state.tasks.map((task) => ({ ...task, position: task.position + 1 })),
              {
                id: taskID,
                label: trimmed,
                position: 0,
                time: 0,
                tagIds: activeTagFilter ? [activeTagFilter] : [],
              },
            ],
            activity: [
              {
                id: `task-created-${Date.now()}`,
                kind: "task_created" as const,
                createdAt,
                taskLabel: trimmed,
                taskHistoryEntryID: taskID,
              },
              ...state.activity,
            ],
          }));

          return taskID;
        },

        startTask(taskID) {
          const previousSession = get().activeSession;

          if (previousSession?.taskId === taskID) {
            return;
          }

          if (previousSession) {
            get().stopActiveTask();
          }

          const task = get().getTaskFromID(taskID);
          const startedAt = new Date().toISOString();

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskID ? { ...t, lastActivatedAt: startedAt } : t,
            ),
            activeSession: { taskId: taskID, startedAt },
            activity: task
              ? [
                  {
                    id: `task-started-${Date.now()}`,
                    kind: "task_started" as const,
                    createdAt: startedAt,
                    taskLabel: task.label,
                    taskHistoryEntryID: taskID,
                  },
                  ...get().activity,
                ]
              : get().activity,
          }));
        },

        stopActiveTask() {
          const { tasks: currentTasks, activeSession, history, activity } = get();
          const completed = completeActiveSession(currentTasks, activeSession);

          if (!completed) {
            set({ activeSession: null });
            return;
          }

          if (!completed.completedSession) {
            set({ tasks: completed.nextTasks, activeSession: null });
            return;
          }

          set({
            tasks: completed.nextTasks,
            activeSession: null,
            history: [completed.completedSession, ...history],
            activity: [createTaskSessionActivity(completed.completedSession), ...activity],
          });
        },

        finishActiveTask() {
          const { activeSession, tasks: currentTasks, activity } = get();
          const finished = computeFinishActiveTaskState(currentTasks, activeSession);

          if (!finished) {
            return;
          }

          set({
            tasks: finished.nextTasks,
            activeSession: null,
            activity: [finished.activityItem, ...activity],
          });
        },

        resetActiveTaskDuration() {
          const { activeSession } = get();
          if (!activeSession) return;
          set({ activeSession: resetActiveSessionStart(activeSession) });
        },

        finishTask(taskID) {
          const { tasks: currentTasks, activity } = get();
          const task = currentTasks.find((t) => t.id === taskID);
          if (!task) return;

          const finishedAt = new Date().toISOString();
          set({
            tasks: currentTasks.map((t) =>
              t.id === taskID
                ? { ...t, isFinished: true, finishedAt, isFavorite: false }
                : t,
            ),
            activity: [
              {
                id: `task-finished-${Date.now()}`,
                kind: "task_finished" as const,
                createdAt: finishedAt,
                taskLabel: task.label,
                taskHistoryEntryID: taskID,
                durationSeconds: task.time,
              } as const,
              ...activity,
            ],
          });
        },

        restoreTask(taskID) {
          const { tasks: currentTasks, activity } = get();
          const task = currentTasks.find((t) => t.id === taskID);
          if (!task) return;

          const restoredAt = new Date().toISOString();
          set({
            tasks: currentTasks.map((t) =>
              t.id === taskID ? { ...t, isFinished: false, finishedAt: undefined } : t,
            ),
            activity: [
              {
                id: `task-restored-${Date.now()}`,
                kind: "task_restored" as const,
                createdAt: restoredAt,
                taskLabel: task.label,
                taskHistoryEntryID: taskID,
              } as const,
              ...activity,
            ],
          });
        },

        resetTaskDuration(taskID) {
          const { tasks: currentTasks } = get();
          set({ tasks: resetTaskDurationInList(currentTasks, taskID) });
        },

        setTaskDuration(taskID, durationSeconds) {
          if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return false;
          const rounded = Math.floor(durationSeconds);
          const task = get().getTaskFromID(taskID);
          if (!task || task.time === rounded) return false;
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === taskID ? { ...item, time: rounded } : item,
            ),
          }));
          return true;
        },

        populateFakeData() {
          const { tasks: currentTasks, history: currentHistory, activity: currentActivity } = get();
          if (currentTasks.length > 0 || currentHistory.length > 0) {
            return false;
          }

          const generatedTasks = createFakeTasks();
          const generatedTags = createFakeTags();
          const { history, activity } = createFakeHistoryData(generatedTasks, Date.now());

          if (history.length === 0) {
            return false;
          }

          set({
            tasks: generatedTasks,
            tags: generatedTags,
            history,
            activity: [...activity, ...currentActivity],
          });

          return true;
        },

        cancelActiveTask(skipConfirmation = false) {
          const { activeSession, tasks: currentTasks, activity } = get();
          if (!activeSession) return false;

          const cancelled = computeCancelActiveTaskState(currentTasks, activeSession);
          if (!cancelled) return false;

          if (!skipConfirmation && cancelled.durationSeconds > 300) {
            if (typeof window !== "undefined") {
              const confirmed = window.confirm(
                `Cancel "${cancelled.taskLabel}" after ${Math.floor(cancelled.durationSeconds / 60)}+ minutes? This will discard the time spent.`,
              );
              if (!confirmed) return false;
            }
          }

          set({ activeSession: null, activity: [cancelled.activityItem, ...activity] });
          return true;
        },

        transferActiveTaskTime(targetTaskID) {
          const { activeSession, tasks: currentTasks, activity } = get();
          const transfer = computeTransferActiveSession(activeSession, currentTasks, targetTaskID);

          if (!transfer) {
            return;
          }

          const transferredAt = new Date().toISOString();
          set({
            tasks: currentTasks,
            activeSession: transfer.nextActiveSession,
            activity: [
              {
                id: `task-transferred-${Date.now()}`,
                kind: "task_transferred" as const,
                createdAt: transferredAt,
                taskLabel: transfer.targetTaskLabel,
                taskHistoryEntryID: targetTaskID,
                sourceTaskLabel: transfer.sourceTaskLabel,
                durationSeconds: transfer.durationSeconds,
              },
              ...activity,
            ],
          });
        },

        resetAllData() {
          set({ ...createDefaultState(tasks), deletedTasks: [], needsDataReset: false, activeTagFilter: null });
        },

        wipeAllData() {
          set({ ...createDefaultState([]), deletedTasks: [], needsDataReset: false, activeTagFilter: null });
        },

        clearHistory() {
          set((state) => ({ ...state, history: [], activity: [] }));
        },

        clearHistoryRange(startISO, endISO) {
          set((state) => {
            const start = startISO ? new Date(startISO).getTime() : 0;
            const end = endISO ? new Date(endISO).getTime() : Date.now();
            const keepActivity = state.activity.filter((item) => {
              const t = new Date(item.createdAt).getTime();
              return t < start || t > end;
            });
            const removedEntryIDs = new Set(
              state.activity
                .filter((item) => {
                  const t = new Date(item.createdAt).getTime();
                  return t >= start && t <= end;
                })
                .map((item) => item.taskHistoryEntryID),
            );
            const keepHistory = state.history.filter(
              (entry) => !removedEntryIDs.has(entry.id),
            );
            return { ...state, activity: keepActivity, history: keepHistory };
          });
        },

        addActivityNote(activityId, text) {
          set((state) => ({
            ...state,
            activity: state.activity.map((item) =>
              item.id === activityId
                ? {
                    ...item,
                    notes: [
                      ...(item.notes ?? []),
                      { id: generateRandomID(), text: text.trim(), createdAt: new Date().toISOString() },
                    ],
                  }
                : item,
            ),
          }));
        },

        deleteActivityNote(activityId, noteId) {
          set((state) => ({
            ...state,
            activity: state.activity.map((item) =>
              item.id === activityId
                ? { ...item, notes: (item.notes ?? []).filter((n) => n.id !== noteId) }
                : item,
            ),
          }));
        },

        deleteActivityItems(ids) {
          const idSet = new Set(ids);
          set((state) => {
            const removed = state.activity.filter((item) => idSet.has(item.id));
            const removedEntryIDs = new Set(
              removed.map((item) => item.taskHistoryEntryID).filter((id): id is string => Boolean(id)),
            );
            const remainingActivity = state.activity.filter((item) => !idSet.has(item.id));
            const referencedByRemaining = new Set(remainingActivity.map((item) => item.taskHistoryEntryID));
            const keepHistory = state.history.filter(
              (entry) => !removedEntryIDs.has(entry.id) || referencedByRemaining.has(entry.id),
            );
            return { ...state, activity: remainingActivity, history: keepHistory };
          });
        },

        markHistoryEntrySynced(historyEntryID, calendarEventId, syncedCalendarId, syncedCalendarName) {
          set((state) => ({
            history: state.history.map((entry) =>
              entry.id === historyEntryID
                ? { ...entry, calendarSyncStatus: "synced", calendarEventId, syncedCalendarId, syncedCalendarName, calendarDeletedAt: undefined }
                : entry,
            ),
            activity: (() => {
              const entry = state.history.find((item) => item.id === historyEntryID);
              if (!entry || entry.calendarSyncStatus === "synced") return state.activity;
              return [
                createCalendarActivity("calendar_synced", { ...entry, calendarSyncStatus: "synced", calendarEventId, syncedCalendarId, syncedCalendarName, calendarDeletedAt: undefined }),
                ...state.activity,
              ];
            })(),
          }));
        },

        markHistoryEntryFailed(historyEntryID) {
          set((state) => ({
            history: state.history.map((entry) =>
              entry.id === historyEntryID ? { ...entry, calendarSyncStatus: "failed" } : entry,
            ),
            activity: (() => {
              const entry = state.history.find((item) => item.id === historyEntryID);
              if (!entry || entry.calendarSyncStatus === "failed") return state.activity;
              return [createCalendarActivity("calendar_sync_failed", { ...entry, calendarSyncStatus: "failed" }), ...state.activity];
            })(),
          }));
        },

        markHistoryEntriesDeleted(historyEntryIDs) {
          const deletedAt = new Date().toISOString();
          set((state) => ({
            history: state.history.map((entry) =>
              historyEntryIDs.includes(entry.id)
                ? { ...entry, calendarSyncStatus: "deleted", calendarDeletedAt: deletedAt }
                : entry,
            ),
          }));
        },

        logCalendarConnected(subjectLabel) {
          set((state) => ({
            activity: [{ id: `calendar-connected-${Date.now()}`, kind: "calendar_connected" as const, createdAt: new Date().toISOString(), taskLabel: "Google Calendar", taskHistoryEntryID: generateRandomID(), subjectLabel }, ...state.activity],
          }));
        },

        logCalendarDisconnected(subjectLabel) {
          set((state) => ({
            activity: [{ id: `calendar-disconnected-${Date.now()}`, kind: "calendar_disconnected" as const, createdAt: new Date().toISOString(), taskLabel: "Google Calendar", taskHistoryEntryID: generateRandomID(), subjectLabel }, ...state.activity],
          }));
        },

        logCalendarSyncEnabled(subjectLabel) {
          set((state) => ({
            activity: [{ id: `calendar-enabled-${Date.now()}`, kind: "calendar_enabled" as const, createdAt: new Date().toISOString(), taskLabel: "Google Calendar", taskHistoryEntryID: generateRandomID(), subjectLabel }, ...state.activity],
          }));
        },

        logCalendarSyncDisabled(subjectLabel) {
          set((state) => ({
            activity: [{ id: `calendar-disabled-${Date.now()}`, kind: "calendar_disabled" as const, createdAt: new Date().toISOString(), taskLabel: "Google Calendar", taskHistoryEntryID: generateRandomID(), subjectLabel }, ...state.activity],
          }));
        },

        logCalendarTargetChanged(previousCalendarName, nextCalendarName) {
          if (previousCalendarName === nextCalendarName) return;
          set((state) => ({
            activity: [{ id: `calendar-target-changed-${Date.now()}`, kind: "calendar_target_changed" as const, createdAt: new Date().toISOString(), taskLabel: "Google Calendar", taskHistoryEntryID: generateRandomID(), oldValue: previousCalendarName, newValue: nextCalendarName }, ...state.activity],
          }));
        },

        logSettingsCursorEnabled() {
          set((state) => ({
            activity: [{ id: `settings-cursor-enabled-${Date.now()}`, kind: "settings_cursor_enabled" as const, createdAt: new Date().toISOString(), taskLabel: "Settings", taskHistoryEntryID: generateRandomID() }, ...state.activity],
          }));
        },

        logSettingsCursorDisabled() {
          set((state) => ({
            activity: [{ id: `settings-cursor-disabled-${Date.now()}`, kind: "settings_cursor_disabled" as const, createdAt: new Date().toISOString(), taskLabel: "Settings", taskHistoryEntryID: generateRandomID() }, ...state.activity],
          }));
        },

        logSettingsPrimaryColorChanged(previousColor, nextColor) {
          if (previousColor === nextColor) return;
          set((state) => ({
            activity: [{ id: `settings-color-changed-${Date.now()}`, kind: "settings_primary_color_changed" as const, createdAt: new Date().toISOString(), taskLabel: "Settings", taskHistoryEntryID: generateRandomID(), oldValue: previousColor, newValue: nextColor }, ...state.activity],
          }));
        },

        getRootTaskIDs() {
          const { tasks, activeTagFilter } = get();
          return tasks
            .filter((task) => {
              if (task.isFinished) return false;
              if (activeTagFilter && !task.tagIds?.includes(activeTagFilter)) return false;
              return true;
            })
            .sort(sortByPosition)
            .map((task) => task.id);
        },

        getTaskFromID(taskID) {
          return get().tasks.find((task) => task.id === taskID) ?? null;
        },

        toggleFavorite(taskID) {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskID ? { ...task, isFavorite: !task.isFavorite } : task,
            ),
          }));
        },

        renameTask(taskID, newLabel) {
          const trimmed = newLabel.trim();
          if (!trimmed) return false;
          const task = get().getTaskFromID(taskID);
          if (!task || task.label === trimmed) return false;

          const renamedAt = new Date().toISOString();
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === taskID ? { ...item, label: trimmed } : item,
            ),
            activity: [
              { id: `task-renamed-${Date.now()}`, kind: "task_renamed" as const, createdAt: renamedAt, taskLabel: trimmed, taskHistoryEntryID: taskID, oldLabel: task.label, newLabel: trimmed },
              ...state.activity,
            ],
          }));
          return true;
        },

        moveTask(taskID, targetTaskID, placement) {
          const { tasks: currentTasks } = get();
          if (taskID === targetTaskID) return false;

          const movingTask = currentTasks.find((item) => item.id === taskID);
          const targetTask = currentTasks.find((item) => item.id === targetTaskID);
          if (!movingTask || !targetTask) return false;

          const movePlan = computeTaskMovePlan(currentTasks, movingTask, targetTask, placement);
          if (!movePlan) return false;

          set((state) => ({
            tasks: applyTaskMovePlan(state.tasks, movePlan),
            activity: [createTaskRepositionActivity(taskID, movingTask.label, movePlan), ...state.activity],
          }));
          return true;
        },

        deleteTask(taskID) {
          const { tasks: currentTasks, activeSession } = get();
          const task = currentTasks.find((item) => item.id === taskID);
          if (!task) return false;
          if (activeSession?.taskId === taskID) return false;

          const deletedAt = new Date().toISOString();
          set((state) => ({
            tasks: state.tasks.filter((item) => item.id !== taskID),
            deletedTasks: [...state.deletedTasks, { ...task, deletedAt }],
            activity: [
              { id: `task-deleted-${Date.now()}`, kind: "task_deleted" as const, createdAt: deletedAt, taskLabel: task.label, taskHistoryEntryID: taskID },
              ...state.activity,
            ],
          }));
          return true;
        },

        clearTrash() {
          set((state) => ({ ...state, deletedTasks: [] }));
        },

        restoreDeletedTask(taskID) {
          const { deletedTasks } = get();
          const taskToRestore = deletedTasks.find((t) => t.id === taskID);
          if (!taskToRestore) return false;

          set((state) => ({
            tasks: [...state.tasks, { ...taskToRestore, deletedAt: undefined }],
            deletedTasks: state.deletedTasks.filter((t) => t.id !== taskID),
            activity: [
              { id: `task-restored-${Date.now()}`, kind: "task_restored" as const, createdAt: new Date().toISOString(), taskLabel: taskToRestore.label, taskHistoryEntryID: taskID },
              ...state.activity,
            ],
          }));
          return true;
        },

        logTaskCopied(taskID, target) {
          const task = get().getTaskFromID(taskID);
          if (!task) return;
          set((state) => ({
            activity: [
              { id: `task-copied-${Date.now()}`, kind: "task_copied" as const, createdAt: new Date().toISOString(), taskLabel: task.label, taskHistoryEntryID: taskID, copyTarget: target },
              ...state.activity,
            ],
          }));
        },
      }),
      {
        name: TODO_STORE_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tasks: state.tasks,
          tags: state.tags,
          deletedTasks: state.deletedTasks,
          activeSession: state.activeSession,
          history: state.history,
          activity: state.activity,
        }),
        migrate: (persistedState) => {
          const maybeStorageValue = persistedState as { state?: unknown; version?: number } | null;
          return (maybeStorageValue?.state ?? persistedState) as unknown;
        },
        merge: (persistedState, currentState) => {
          const rawState = persistedState as unknown;
          const validated = validatePersistedState(rawState, tasks);

          if (validated.hasLegacyNesting) {
            return { ...currentState, ...createDefaultState(tasks), deletedTasks: [], needsDataReset: true };
          }

          if (!validated.isValid) {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(TODO_STORE_STORAGE_KEY);
            }
          }

          if (validated.isValid && isLegacySeededFakeState(validated.state)) {
            return { ...currentState, ...createDefaultState(tasks) };
          }

          return { ...currentState, ...validated.state };
        },
      },
    ),
  );
