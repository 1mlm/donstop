import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createFakeHistoryData, createFakeTasks } from "../fake";
import { malikDebug } from "../malik-debug";
import type { TaskObj } from "../types";
import {
  completeActiveSession,
  createCalendarActivity,
  createDefaultState,
  createTaskSessionActivity,
  sortByPosition,
  type TaskID,
  TODO_STORE_STORAGE_KEY,
  validatePersistedState,
} from "./store-model";

export type TODOStoreState = ReturnType<typeof createDefaultState> & {
  createTask: (label: string, parentId?: TaskID) => TaskID | null;
  startTask: (taskID: TaskID) => void;
  stopActiveTask: () => void;
  finishActiveTask: () => void;
  resetActiveTaskDuration: () => void;
  finishTask: (taskID: TaskID) => void;
  restoreTask: (taskID: TaskID) => void;
  resetTaskDuration: (taskID: TaskID) => void;
  populateFakeData: () => boolean;
  cancelActiveTask: (skipConfirmation?: boolean) => boolean;
  transferActiveTaskTime: (targetTaskID: TaskID) => void;
  toggleFavorite: (taskID: TaskID) => void;
  renameTask: (taskID: TaskID, newLabel: string) => boolean;
  moveTask: (
    taskID: TaskID,
    targetTaskID: TaskID,
    placement: "before" | "after" | "inside",
  ) => boolean;
  deleteTask: (taskID: TaskID) => boolean;
  logTaskCopied: (taskID: TaskID, target: "id" | "name") => void;
  resetAllData: () => void;
  wipeAllData: () => void;
  clearHistory: () => void;
  markHistoryEntrySynced: (
    historyEntryID: string,
    calendarEventId: string,
    syncedCalendarId: string,
    syncedCalendarName: string,
  ) => void;
  markHistoryEntryFailed: (historyEntryID: string) => void;
  markHistoryEntriesDeleted: (historyEntryIDs: string[]) => void;
  getRootTaskIDs: () => TaskID[];
  getTaskFromID: (taskID: TaskID) => TaskObj | null;
  getTaskChildrenIDs: (taskID: TaskID) => TaskID[];
  hasActiveChildRecursive: (taskID: TaskID) => boolean;
};

export const createTODOStoreBase = (tasks: TaskObj[]) =>
  create<TODOStoreState>()(
    persist(
      (set, get) => ({
        ...createDefaultState(tasks),
        createTask(label, parentId) {
          const trimmed = label.trim();
          if (!trimmed) {
            return null;
          }

          const taskID = crypto.randomUUID();
          const createdAt = new Date().toISOString();

          set((state) => ({
            tasks: [
              ...state.tasks.map((task) =>
                task.parentId === parentId
                  ? { ...task, position: task.position + 1 }
                  : task,
              ),
              {
                id: taskID,
                label: trimmed,
                parentId,
                position: 0,
                time: 0,
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
            malikDebug("\u2B1C", "store task already active", { taskID });
            return;
          }

          if (previousSession) {
            get().stopActiveTask();
          }

          const task = get().getTaskFromID(taskID);
          const startedAt = new Date().toISOString();

          set({
            activeSession: {
              taskId: taskID,
              startedAt,
            },
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
          });

          malikDebug("\u2B1C", "store task started", {
            taskID,
            label: task?.label,
          });
        },
        stopActiveTask() {
          const {
            tasks: currentTasks,
            activeSession,
            history,
            activity,
          } = get();
          const completed = completeActiveSession(currentTasks, activeSession);

          if (!completed) {
            set({ activeSession: null });
            malikDebug("\u2B1C", "store task stop no active session");
            return;
          }

          if (!completed.completedSession) {
            set({
              tasks: completed.nextTasks,
              activeSession: null,
            });

            malikDebug("\u2B1C", "store task ignored under 5m");
            return;
          }

          set({
            tasks: completed.nextTasks,
            activeSession: null,
            history: [completed.completedSession, ...history],
            activity: [
              createTaskSessionActivity(completed.completedSession),
              ...activity,
            ],
          });

          malikDebug("\u2B1C", "store task saved", {
            task: completed.completedSession.taskLabel,
            durationSeconds: completed.completedSession.durationSeconds,
          });
        },
        finishActiveTask() {
          const { activeSession, tasks: currentTasks, activity } = get();

          if (!activeSession) {
            malikDebug("\u2B1C", "store task finish no active session");
            return;
          }

          const task = currentTasks.find((t) => t.id === activeSession.taskId);
          if (!task) return;

          const completedDuration = Math.floor(
            (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000,
          );

          const finishedAt = new Date().toISOString();

          set({
            tasks: currentTasks.map((t) =>
              t.id === activeSession.taskId
                ? { ...t, isFinished: true, finishedAt, isFavorite: false }
                : t,
            ),
            activeSession: null,
            activity: [
              {
                id: `task-finished-${Date.now()}`,
                kind: "task_finished" as const,
                createdAt: finishedAt,
                taskLabel: task.label,
                taskHistoryEntryID: activeSession.taskId,
                durationSeconds: completedDuration,
              } as const,
              ...activity,
            ],
          });

          malikDebug("\u2B1C", "store task finished", {
            task: task.label,
            durationSeconds: completedDuration,
          });
        },
        resetActiveTaskDuration() {
          const { activeSession } = get();

          if (!activeSession) {
            malikDebug("\u2B1C", "store task reset duration no active session");
            return;
          }

          const resetAt = new Date().toISOString();

          set({
            activeSession: {
              taskId: activeSession.taskId,
              startedAt: resetAt,
            },
          });

          malikDebug("\u2B1C", "store task duration reset", {
            taskID: activeSession.taskId,
          });
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
              t.id === taskID
                ? { ...t, isFinished: false, finishedAt: undefined }
                : t,
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
          set({
            tasks: currentTasks.map((t) =>
              t.id === taskID ? { ...t, time: 0 } : t,
            ),
          });
        },
        populateFakeData() {
          const {
            tasks: currentTasks,
            history: currentHistory,
            activity: currentActivity,
          } = get();

          if (currentTasks.length > 0 || currentHistory.length > 0) {
            malikDebug("⬜", "store fake data skipped store not empty");
            return false;
          }

          const generatedTasks = createFakeTasks();

          const { history, activity } = createFakeHistoryData(
            generatedTasks,
            Date.now(),
          );

          if (history.length === 0) {
            malikDebug("⬜", "store fake data skipped no candidates");
            return false;
          }

          set({
            tasks: generatedTasks,
            history,
            activity: [...activity, ...currentActivity],
          });

          malikDebug("⬜", "store fake data added", {
            taskCount: generatedTasks.length,
            historyCount: history.length,
            activityCount: activity.length,
          });

          return true;
        },
        cancelActiveTask(skipConfirmation = false) {
          const { activeSession, tasks: currentTasks, activity } = get();

          if (!activeSession) {
            malikDebug("\u2B1C", "store task cancel no active session");
            return false;
          }

          const task = currentTasks.find((t) => t.id === activeSession.taskId);
          if (!task) return false;

          const durationSeconds = Math.floor(
            (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000,
          );

          if (!skipConfirmation && durationSeconds > 300) {
            // 5 minutes = 300 seconds
            if (typeof window !== "undefined") {
              const confirmed = window.confirm(
                `Cancel "${task.label}" after ${Math.floor(durationSeconds / 60)}+ minutes? This will discard the time spent.`,
              );
              if (!confirmed) return false;
            }
          }

          const cancelledAt = new Date().toISOString();

          set({
            activeSession: null,
            activity: [
              {
                id: `task-cancelled-${Date.now()}`,
                kind: "task_cancelled" as const,
                createdAt: cancelledAt,
                taskLabel: task.label,
                taskHistoryEntryID: activeSession.taskId,
                durationSeconds,
              } as const,
              ...activity,
            ],
          });

          malikDebug("\u2B1C", "store task cancelled", {
            task: task.label,
            durationSeconds,
          });

          return true;
        },
        transferActiveTaskTime(targetTaskID) {
          const { activeSession, tasks: currentTasks, activity } = get();

          if (!activeSession) {
            malikDebug("\u2B1C", "store task transfer no active session");
            return;
          }

          const sourceTask = currentTasks.find(
            (t) => t.id === activeSession.taskId,
          );
          const targetTask = currentTasks.find((t) => t.id === targetTaskID);

          if (!sourceTask || !targetTask) {
            malikDebug("\u2B1C", "store task transfer tasks not found");
            return;
          }

          const transferMomentMs = Date.now();
          const transferredDuration = Math.floor(
            (transferMomentMs - new Date(activeSession.startedAt).getTime()) /
              1000,
          );
          const transferredAt = new Date(transferMomentMs).toISOString();

          set({
            tasks: currentTasks,
            activeSession: {
              taskId: targetTaskID,
              // Keep original start time so transferred elapsed time remains in the live segment.
              startedAt: activeSession.startedAt,
            },
            activity: [
              {
                id: `task-transferred-${Date.now()}`,
                kind: "task_transferred" as const,
                createdAt: transferredAt,
                taskLabel: targetTask.label,
                taskHistoryEntryID: targetTaskID,
                sourceTaskLabel: sourceTask.label,
                durationSeconds: transferredDuration,
              },
              ...activity,
            ],
          });

          malikDebug("\u2B1C", "store task time transferred", {
            from: sourceTask.label,
            to: targetTask.label,
            durationSeconds: transferredDuration,
          });
        },
        resetAllData() {
          set(createDefaultState(tasks));
          malikDebug("\u2B1C", "store reset all");
        },
        wipeAllData() {
          set(createDefaultState([]));
          malikDebug("\u2B1C", "store wiped all data");
        },
        clearHistory() {
          set((state) => ({
            ...state,
            history: [],
            activity: [],
          }));
          malikDebug("\u2B1C", "store history cleared");
        },
        markHistoryEntrySynced(
          historyEntryID,
          calendarEventId,
          syncedCalendarId,
          syncedCalendarName,
        ) {
          set((state) => ({
            history: state.history.map((entry) =>
              entry.id === historyEntryID
                ? {
                    ...entry,
                    calendarSyncStatus: "synced",
                    calendarEventId,
                    syncedCalendarId,
                    syncedCalendarName,
                    calendarDeletedAt: undefined,
                  }
                : entry,
            ),
            activity: (() => {
              const entry = state.history.find(
                (item) => item.id === historyEntryID,
              );
              const shouldLog = entry && entry.calendarSyncStatus !== "synced";

              if (!entry || !shouldLog) {
                return state.activity;
              }

              return [
                createCalendarActivity("calendar_synced", {
                  ...entry,
                  calendarSyncStatus: "synced",
                  calendarEventId,
                  syncedCalendarId,
                  syncedCalendarName,
                  calendarDeletedAt: undefined,
                }),
                ...state.activity,
              ];
            })(),
          }));

          malikDebug("\u2B1C", "store sync ok", {
            historyEntryID,
            calendarEventId,
            syncedCalendarId,
          });
        },
        markHistoryEntryFailed(historyEntryID) {
          set((state) => ({
            history: state.history.map((entry) =>
              entry.id === historyEntryID
                ? {
                    ...entry,
                    calendarSyncStatus: "failed",
                  }
                : entry,
            ),
            activity: (() => {
              const entry = state.history.find(
                (item) => item.id === historyEntryID,
              );
              const shouldLog = entry && entry.calendarSyncStatus !== "failed";

              if (!entry || !shouldLog) {
                return state.activity;
              }

              return [
                createCalendarActivity("calendar_sync_failed", {
                  ...entry,
                  calendarSyncStatus: "failed",
                }),
                ...state.activity,
              ];
            })(),
          }));

          malikDebug("\u{1F7E5}", "store sync failed", { historyEntryID });
        },
        markHistoryEntriesDeleted(historyEntryIDs) {
          const deletedAt = new Date().toISOString();

          set((state) => ({
            history: state.history.map((entry) =>
              historyEntryIDs.includes(entry.id)
                ? {
                    ...entry,
                    calendarSyncStatus: "deleted",
                    calendarDeletedAt: deletedAt,
                  }
                : entry,
            ),
          }));

          malikDebug("\u2B1C", "store calendar events deleted", {
            count: historyEntryIDs.length,
          });
        },
        getRootTaskIDs() {
          return get()
            .tasks.filter((task) => !task.parentId)
            .sort(sortByPosition)
            .map((task) => task.id);
        },
        getTaskFromID(taskID) {
          return get().tasks.find((task) => task.id === taskID) || null;
        },
        getTaskChildrenIDs(taskID) {
          return get()
            .tasks.filter((task) => task.parentId === taskID)
            .sort(sortByPosition)
            .map((task) => task.id);
        },
        toggleFavorite(taskID) {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskID
                ? { ...task, isFavorite: !task.isFavorite }
                : task,
            ),
          }));

          const task = get().getTaskFromID(taskID);
          malikDebug("\u2B1C", "store task favorite toggled", {
            taskID,
            label: task?.label,
            isFavorite: task?.isFavorite,
          });
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
              {
                id: `task-renamed-${Date.now()}`,
                kind: "task_renamed" as const,
                createdAt: renamedAt,
                taskLabel: trimmed,
                taskHistoryEntryID: taskID,
                oldLabel: task.label,
                newLabel: trimmed,
              },
              ...state.activity,
            ],
          }));

          return true;
        },
        moveTask(taskID, targetTaskID, placement) {
          const { tasks: currentTasks } = get();

          if (taskID === targetTaskID) {
            return false;
          }

          const movingTask = currentTasks.find((item) => item.id === taskID);
          const targetTask = currentTasks.find(
            (item) => item.id === targetTaskID,
          );

          if (!movingTask || !targetTask) {
            return false;
          }

          const collectDescendants = (rootID: string): string[] => {
            const direct = currentTasks
              .filter((item) => item.parentId === rootID)
              .map((item) => item.id);

            return direct.flatMap((childID) => [
              childID,
              ...collectDescendants(childID),
            ]);
          };

          const descendantIDs = collectDescendants(taskID);

          if (descendantIDs.includes(targetTaskID)) {
            return false;
          }

          const oldParentID = movingTask.parentId;
          const destinationParentID =
            placement === "inside" ? targetTaskID : targetTask.parentId;

          const destinationSiblings = currentTasks
            .filter(
              (item) =>
                item.parentId === destinationParentID && item.id !== taskID,
            )
            .sort(sortByPosition);

          const targetIndex =
            placement === "inside"
              ? 0
              : destinationSiblings.findIndex(
                  (item) => item.id === targetTaskID,
                );

          if (placement !== "inside" && targetIndex < 0) {
            return false;
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
              return false;
            }
          }

          const destinationPositionByID = new Map(
            reorderedDestination.map((item, index) => [item.id, index]),
          );

          const previousSiblingPositionByID =
            oldParentID !== destinationParentID
              ? new Map(
                  currentTasks
                    .filter(
                      (item) =>
                        item.parentId === oldParentID && item.id !== taskID,
                    )
                    .sort(sortByPosition)
                    .map((item, index) => [item.id, index]),
                )
              : null;

          set((state) => ({
            tasks: state.tasks.map((item) => {
              const destinationPosition = destinationPositionByID.get(item.id);
              if (destinationPosition !== undefined) {
                return {
                  ...item,
                  parentId: destinationParentID,
                  position: destinationPosition,
                };
              }

              const previousSiblingPosition = previousSiblingPositionByID?.get(
                item.id,
              );
              if (previousSiblingPosition !== undefined) {
                return {
                  ...item,
                  parentId: oldParentID,
                  position: previousSiblingPosition,
                };
              }

              return item;
            }),
          }));

          return true;
        },
        deleteTask(taskID) {
          const { tasks: currentTasks, activeSession } = get();
          const task = currentTasks.find((item) => item.id === taskID);
          if (!task) return false;

          const collectDescendants = (rootID: string): string[] => {
            const direct = currentTasks
              .filter((item) => item.parentId === rootID)
              .map((item) => item.id);

            return direct.flatMap((childID) => [
              childID,
              ...collectDescendants(childID),
            ]);
          };

          const subtreeIDs = [taskID, ...collectDescendants(taskID)];

          if (activeSession && subtreeIDs.includes(activeSession.taskId)) {
            return false;
          }

          const deletedAt = new Date().toISOString();

          set((state) => ({
            tasks: state.tasks.filter((item) => !subtreeIDs.includes(item.id)),
            activity: [
              {
                id: `task-deleted-${Date.now()}`,
                kind: "task_deleted" as const,
                createdAt: deletedAt,
                taskLabel: task.label,
                taskHistoryEntryID: taskID,
              },
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
              {
                id: `task-copied-${Date.now()}`,
                kind: "task_copied" as const,
                createdAt: new Date().toISOString(),
                taskLabel: task.label,
                taskHistoryEntryID: taskID,
                copyTarget: target,
              },
              ...state.activity,
            ],
          }));
        },
        hasActiveChildRecursive(taskID) {
          const activeTaskID = get().activeSession?.taskId;
          if (!activeTaskID) return false;

          const checkChildren = (parentID: string): boolean => {
            const childrenIDs = get()
              .tasks.filter((task) => task.parentId === parentID)
              .map((task) => task.id);

            if (childrenIDs.includes(activeTaskID)) {
              return true;
            }

            return childrenIDs.some((childID) => checkChildren(childID));
          };

          return checkChildren(taskID);
        },
      }),
      {
        name: TODO_STORE_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tasks: state.tasks,
          activeSession: state.activeSession,
          history: state.history,
          activity: state.activity,
        }),
        migrate: (persistedState) => {
          const maybeStorageValue = persistedState as {
            state?: unknown;
            version?: number;
          } | null;
          return (maybeStorageValue?.state ?? persistedState) as unknown;
        },
        merge: (persistedState, currentState) => {
          const rawState = persistedState as unknown;
          const validated = validatePersistedState(rawState, tasks);

          if (!validated.isValid) {
            malikDebug("\u{1F7E5}", "store localstorage invalid, cleaned");
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(TODO_STORE_STORAGE_KEY);
            }
          } else {
            malikDebug("\u2B1C", "store localstorage valid");
          }

          return {
            ...currentState,
            ...validated.state,
          };
        },
      },
    ),
  );
