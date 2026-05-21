export type TagObj = {
  id: string;
  name: string;
  icon: string;
};

export type TaskObj = {
  id: string;
  label: string;
  position: number;
  time: number;
  tagIds?: string[];
  isFinished?: boolean;
  finishedAt?: string;
  isFavorite?: boolean;
  deletedAt?: string;
  lastActivatedAt?: string;
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
  | "task_repositioned"
  | "calendar_synced"
  | "calendar_sync_failed"
  | "calendar_connected"
  | "calendar_disconnected"
  | "calendar_enabled"
  | "calendar_disabled"
  | "calendar_target_changed"
  | "task_finished"
  | "task_restored"
  | "task_cancelled"
  | "task_renamed"
  | "task_deleted"
  | "task_copied"
  | "settings_cursor_enabled"
  | "settings_cursor_disabled"
  | "settings_primary_color_changed";

export type ActivityNote = {
  id: string;
  text: string;
  createdAt: string;
};

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
  moveDestinationParentLabel?: string;
  moveBeforeTaskLabel?: string;
  moveAfterTaskLabel?: string;
  subjectLabel?: string;
  oldValue?: string;
  newValue?: string;
  notes?: ActivityNote[];
};
