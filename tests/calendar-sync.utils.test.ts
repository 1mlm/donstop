import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarSyncInFlightEntryIDs,
  syncPendingEntries,
} from "../lib/calendar/calendar-sync.utils.ts";
import type { TaskHistoryEntry } from "../lib/types.ts";

function createPendingEntry(
  overrides: Partial<TaskHistoryEntry> = {},
): TaskHistoryEntry {
  return {
    id: "entry-1",
    taskId: "task-1",
    taskLabel: "Task A",
    startedAt: "2026-03-12T10:00:00.000Z",
    endedAt: "2026-03-12T10:30:00.000Z",
    durationSeconds: 1800,
    calendarSyncStatus: "pending",
    ...overrides,
  };
}

test("syncPendingEntries syncs pending entry and clears error", async () => {
  const entry = createPendingEntry();

  const calls: string[] = [];
  let syncedArgs: string[] | null = null;
  let failedID: string | null = null;
  let lastError: string | null = "old error";

  const result = await syncPendingEntries({
    pending: [entry],
    accessToken: "token",
    targetCalendarID: "cal-1",
    selectedCalendarName: "My Calendar",
    inFlightEntryIDs: new Set<string>(),
    createEvent: async (_token, _calendarID, currentEntry) => {
      calls.push(currentEntry.id);
      return { id: "event-1" };
    },
    markSynced: (historyEntryID, eventID, calendarID, calendarName) => {
      syncedArgs = [historyEntryID, eventID, calendarID, calendarName];
    },
    markFailed: (historyEntryID) => {
      failedID = historyEntryID;
    },
    setSyncError: (message) => {
      lastError = message;
    },
  });

  assert.equal(result.hasError, false);
  assert.deepEqual(calls, ["entry-1"]);
  assert.deepEqual(syncedArgs, ["entry-1", "event-1", "cal-1", "My Calendar"]);
  assert.equal(failedID, null);
  assert.equal(lastError, null);
});

test("syncPendingEntries marks failed entry and keeps error when event creation fails", async () => {
  const entry = createPendingEntry({ id: "entry-fail" });

  let failedID: string | null = null;
  let syncedCalled = false;
  let lastError: string | null = null;

  const result = await syncPendingEntries({
    pending: [entry],
    accessToken: "token",
    targetCalendarID: "cal-1",
    selectedCalendarName: "My Calendar",
    inFlightEntryIDs: new Set<string>(),
    createEvent: async () => {
      throw new Error("Boom");
    },
    markSynced: () => {
      syncedCalled = true;
    },
    markFailed: (historyEntryID) => {
      failedID = historyEntryID;
    },
    setSyncError: (message) => {
      lastError = message;
    },
  });

  assert.equal(result.hasError, true);
  assert.equal(syncedCalled, false);
  assert.equal(failedID, "entry-fail");
  assert.equal(lastError, "Boom");
});

test("syncPendingEntries dedupes concurrent runs by in-flight entry id", async () => {
  const entry = createPendingEntry({ id: "entry-concurrent" });
  const inFlight = new Set<string>();
  let createCount = 0;

  const createEvent = async () => {
    createCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { id: `event-${createCount}` };
  };

  const sharedParams = {
    pending: [entry],
    accessToken: "token",
    targetCalendarID: "cal-1",
    selectedCalendarName: "My Calendar",
    inFlightEntryIDs: inFlight,
    createEvent,
    markSynced: () => {},
    markFailed: () => {},
    setSyncError: () => {},
  };

  await Promise.all([
    syncPendingEntries(sharedParams),
    syncPendingEntries(sharedParams),
  ]);

  assert.equal(createCount, 1);
  assert.equal(inFlight.size, 0);
});

test("calendarSyncInFlightEntryIDs can be reused and cleared", () => {
  calendarSyncInFlightEntryIDs.clear();
  calendarSyncInFlightEntryIDs.add("x");
  assert.equal(calendarSyncInFlightEntryIDs.has("x"), true);
  calendarSyncInFlightEntryIDs.clear();
  assert.equal(calendarSyncInFlightEntryIDs.size, 0);
});
