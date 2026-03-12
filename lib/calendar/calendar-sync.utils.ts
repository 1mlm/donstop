import type { TaskHistoryEntry } from "../types";

export type SyncPendingEntriesParams = {
  pending: TaskHistoryEntry[];
  accessToken: string;
  targetCalendarID: string;
  selectedCalendarName: string;
  inFlightEntryIDs?: Set<string>;
  createEvent: (
    accessToken: string,
    targetCalendarID: string,
    entry: TaskHistoryEntry,
  ) => Promise<{ id: string }>;
  markSynced: (
    historyEntryID: string,
    calendarEventId: string,
    syncedCalendarId: string,
    syncedCalendarName: string,
  ) => void;
  markFailed: (historyEntryID: string) => void;
  setSyncError: (message: string | null) => void;
};

export const calendarSyncInFlightEntryIDs = new Set<string>();

export async function syncPendingEntries({
  pending,
  accessToken,
  targetCalendarID,
  selectedCalendarName,
  inFlightEntryIDs = calendarSyncInFlightEntryIDs,
  createEvent,
  markSynced,
  markFailed,
  setSyncError,
}: SyncPendingEntriesParams) {
  let hasError = false;

  for (const entry of pending) {
    if (inFlightEntryIDs.has(entry.id)) {
      continue;
    }

    inFlightEntryIDs.add(entry.id);

    try {
      const event = await createEvent(accessToken, targetCalendarID, entry);

      markSynced(entry.id, event.id, targetCalendarID, selectedCalendarName);
    } catch (error) {
      hasError = true;
      markFailed(entry.id);
      setSyncError(
        error instanceof Error ? error.message : "Calendar sync failed",
      );
    } finally {
      inFlightEntryIDs.delete(entry.id);
    }
  }

  if (!hasError) {
    setSyncError(null);
  }

  return { hasError };
}
