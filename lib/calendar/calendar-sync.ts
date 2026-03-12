"use client";

import { useEffect, useMemo, useState } from "react";
import { malikDebug } from "../malik-debug";
import { useTODOStore } from "../store";
import type { TaskHistoryEntry } from "../types";
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
      let hasError = false;

      for (const entry of pending) {
        try {
          const event = await createGoogleCalendarEvent(
            auth.accessToken,
            targetCalendarID,
            entry,
          );
          markSynced(
            entry.id,
            event.id,
            targetCalendarID,
            selectedCalendar?.summary || "Unknown calendar",
          );
          malikDebug("✅", "synced to calendar", { task: entry.taskLabel });
        } catch (error) {
          hasError = true;
          markFailed(entry.id);
          setSyncError(
            error instanceof Error ? error.message : "Calendar sync failed",
          );
          malikDebug("🟥", "calendar sync error", error);
        }
      }

      if (!hasError) {
        setSyncError(null);
      }
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
