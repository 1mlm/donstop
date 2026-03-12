import type { HistoryActivityItem, TaskHistoryEntry } from "@/lib/types";

export function getElapsedSecondsFromNow(
  isoString: string,
  nowMs = Date.now(),
) {
  const timestamp = new Date(isoString).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const elapsed = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  return elapsed;
}

export function isSameLocalDay(leftIso: string, rightIso: string) {
  const left = new Date(leftIso);
  const right = new Date(rightIso);

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatRelativeDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes}m${secs}s`;
  }

  return `${minutes}m${secs}s`;
}

export function buildDisplayActivity(
  activity: HistoryActivityItem[],
  history: TaskHistoryEntry[],
): HistoryActivityItem[] {
  if (activity.length > 0) {
    return activity.filter((item) => item.kind !== "calendar_synced");
  }

  return history.map((entry: TaskHistoryEntry) => ({
    id: `fallback-${entry.id}`,
    kind: "task_session" as const,
    createdAt: entry.endedAt,
    taskLabel: entry.taskLabel,
    taskHistoryEntryID: entry.id,
    durationSeconds: entry.durationSeconds,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
  }));
}

export function buildSyncedAtByEntryID(activity: HistoryActivityItem[]) {
  const syncedAtByEntryID = new Map<string, string>();

  for (const item of activity) {
    if (
      item.kind === "calendar_synced" &&
      !syncedAtByEntryID.has(item.taskHistoryEntryID)
    ) {
      syncedAtByEntryID.set(item.taskHistoryEntryID, item.createdAt);
    }
  }

  return syncedAtByEntryID;
}
