export type TaskObj = {
  id: string;
  label: string;
  parentId?: string;
  position: number;
  time: number;
  isFinished?: boolean;
  finishedAt?: string;
  isFavorite?: boolean;
};

export type ActiveTaskSession = {
  taskId: TaskObj["id"];
  startedAt: string;
};

export type CalendarSyncStatus = "pending" | "synced" | "failed" | "deleted";

export type TaskHistoryEntry = {
  id: string;
  taskId: TaskObj["id"];
  taskLabel: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  calendarSyncStatus: CalendarSyncStatus;
  calendarEventId?: string;
  syncedCalendarId?: string;
  syncedCalendarName?: string;
  calendarDeletedAt?: string;
};

export type HistoryActivityKind =
  | "task_created"
  | "task_session"
  | "task_started"
  | "task_transferred"
  | "calendar_synced"
  | "calendar_sync_failed"
  | "task_finished"
  | "task_restored"
  | "task_cancelled"
  | "task_renamed"
  | "task_deleted"
  | "task_copied";

export type HistoryActivityItem = {
  id: string;
  kind: HistoryActivityKind;
  createdAt: string;
  taskLabel: string;
  taskHistoryEntryID: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  oldLabel?: string;
  newLabel?: string;
  sourceTaskLabel?: string;
  copyTarget?: "id" | "name";
};
