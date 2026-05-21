"use client";

import { useEffect, useMemo, useState } from "react";
import { useTODOStore } from "../store";
import type { TaskHistoryEntry } from "../types";
import {
  calendarSyncInFlightEntryIDs,
  syncPendingEntries,
} from "./calendar-sync.utils";
import {
  createGoogleCalendarEvent,
  type GoogleCalendarListEntry,
} from "./google-calendar";

export function useCalendarSync(
  auth: { accessToken: string; calendars: GoogleCalendarListEntry[] } | null,
  targetCalendarID: string | null,
) {
  const history = useTODOStore((state) => state.history) as TaskHistoryEntry[];
  const markSynced = useTODOStore((state) => state.markHistoryEntrySynced);
  const markFailed = useTODOStore((state) => state.markHistoryEntryFailed);
  const selectedCalendar =
    auth?.calendars.find((calendar) => calendar.id === targetCalendarID) ||
    null;

  const pending = useMemo(
    () =>
      history.filter(
        (entry: TaskHistoryEntry) => entry.calendarSyncStatus === "pending",
      ),
    [history],
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync pending items when connection + calendar are ready
  useEffect(() => {
    if (!auth || !targetCalendarID || pending.length === 0 || isSyncing) {
      return;
    }

    const sync = async () => {
      setIsSyncing(true);
      setSyncError(null);
      await syncPendingEntries({
        pending,
        accessToken: auth.accessToken,
        targetCalendarID,
        selectedCalendarName: selectedCalendar?.summary || "Unknown calendar",
        inFlightEntryIDs: calendarSyncInFlightEntryIDs,
        createEvent: createGoogleCalendarEvent,
        markSynced,
        markFailed,
        setSyncError,
      });

      setIsSyncing(false);
    };

    void sync();
  }, [
    auth,
    targetCalendarID,
    pending,
    isSyncing,
    markSynced,
    markFailed,
    selectedCalendar?.summary,
  ]);

  return {
    pending,
    isSyncing,
    syncError,
  };
}
