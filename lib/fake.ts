import { generateRandomID } from "../lib/util";
import type { HistoryActivityItem, TagObj, TaskHistoryEntry, TaskObj } from "./types";

const FAKE_TAGS: TagObj[] = [
  { id: "tag-school", name: "School", icon: "Mortarboard01Icon" },
  { id: "tag-freelance", name: "Freelance", icon: "BriefcaseIcon" },
  { id: "tag-health", name: "Health", icon: "Activity01Icon" },
  { id: "tag-personal", name: "Personal", icon: "Home01Icon" },
];

const FAKE_TASKS: TaskObj[] = [
  {
    id: "task-calc",
    label: "Calculus problem set 4",
    position: 0,
    time: 7200,
    tagIds: ["tag-school"],
    isFavorite: true,
    lastActivatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-chem",
    label: "Organic chemistry quiz flashcards",
    position: 1,
    time: 3640,
    tagIds: ["tag-school"],
    lastActivatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-freelance",
    label: "Client dashboard redesign",
    position: 2,
    time: 9120,
    tagIds: ["tag-freelance"],
    isFavorite: true,
    lastActivatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-invoice",
    label: "Send invoice for March",
    position: 3,
    time: 480,
    tagIds: ["tag-freelance"],
    lastActivatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-history",
    label: "History essay outline",
    position: 4,
    time: 2700,
    tagIds: ["tag-school"],
  },
  {
    id: "task-run",
    label: "Morning run (5km)",
    position: 5,
    time: 1800,
    tagIds: ["tag-health"],
    lastActivatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-groceries",
    label: "Grocery shopping list",
    position: 6,
    time: 600,
    tagIds: ["tag-personal"],
  },
];

export function createFakeTags(): TagObj[] {
  return FAKE_TAGS.map((t) => ({ ...t }));
}

export function createFakeTasks(): TaskObj[] {
  return FAKE_TASKS.map((t) => ({ ...t }));
}

export function createFakeHistoryData(
  tasks: TaskObj[],
  nowMs: number,
): { history: TaskHistoryEntry[]; activity: HistoryActivityItem[] } {
  const history: TaskHistoryEntry[] = [];
  const activity: HistoryActivityItem[] = [];

  function pushHistory(
    task: TaskObj,
    startOffsetMs: number,
    durationMs: number,
    calendarSynced = false,
  ) {
    const startedAt = new Date(nowMs - startOffsetMs).toISOString();
    const endedAt = new Date(nowMs - startOffsetMs + durationMs).toISOString();
    const durationSeconds = Math.floor(durationMs / 1000);
    const entryId = generateRandomID();

    const entry: TaskHistoryEntry = {
      id: entryId,
      taskId: task.id,
      taskLabel: task.label,
      startedAt,
      endedAt,
      durationSeconds,
      calendarSyncStatus: calendarSynced ? "synced" : "pending",
      calendarEventId: calendarSynced ? `gcal-${entryId}` : undefined,
    };

    history.push(entry);

    activity.push({
      id: generateRandomID(),
      kind: "task_session",
      createdAt: endedAt,
      taskLabel: task.label,
      taskHistoryEntryID: entryId,
      durationSeconds,
      startedAt,
      endedAt,
    });

    if (calendarSynced) {
      activity.push({
        id: generateRandomID(),
        kind: "calendar_synced",
        createdAt: endedAt,
        taskLabel: task.label,
        taskHistoryEntryID: entryId,
      });
    }
  }

  function pushActivity(
    partial: Omit<HistoryActivityItem, "id" | "taskHistoryEntryID"> & { taskHistoryEntryID?: string },
  ) {
    activity.push({
      id: generateRandomID(),
      taskHistoryEntryID: generateRandomID(),
      ...partial,
    } as HistoryActivityItem);
  }

  const calc = tasks.find((t) => t.id === "task-calc");
  const chem = tasks.find((t) => t.id === "task-chem");
  const freelance = tasks.find((t) => t.id === "task-freelance");
  const invoice = tasks.find((t) => t.id === "task-invoice");
  const run = tasks.find((t) => t.id === "task-run");

  if (calc) {
    pushHistory(calc, 2 * 3600 * 1000, 45 * 60 * 1000, true);
    pushHistory(calc, 6 * 3600 * 1000, 90 * 60 * 1000, true);
    pushHistory(calc, 26 * 3600 * 1000, 60 * 60 * 1000);
  }
  if (chem) {
    pushHistory(chem, 5 * 3600 * 1000, 35 * 60 * 1000);
    pushHistory(chem, 29 * 3600 * 1000, 50 * 60 * 1000, true);
  }
  if (freelance) {
    pushHistory(freelance, 24 * 3600 * 1000, 120 * 60 * 1000, true);
    pushHistory(freelance, 48 * 3600 * 1000, 90 * 60 * 1000, true);
  }
  if (invoice) {
    pushHistory(invoice, 26 * 3600 * 1000, 8 * 60 * 1000);
  }
  if (run) {
    pushHistory(run, 48 * 3600 * 1000, 30 * 60 * 1000);
    pushHistory(run, 72 * 3600 * 1000, 28 * 60 * 1000);
  }

  pushActivity({
    kind: "task_finished",
    createdAt: new Date(nowMs - 3 * 3600 * 1000).toISOString(),
    taskLabel: "Q1 limits review",
    durationSeconds: 620,
  });

  pushActivity({
    kind: "calendar_connected",
    createdAt: new Date(nowMs - 20 * 60 * 1000).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "student@example.com",
  });
  pushActivity({
    kind: "calendar_enabled",
    createdAt: new Date(nowMs - 18 * 60 * 1000).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "DonStop",
  });
  pushActivity({
    kind: "settings_cursor_enabled",
    createdAt: new Date(nowMs - 15 * 60 * 1000).toISOString(),
    taskLabel: "Settings",
  });
  pushActivity({
    kind: "settings_primary_color_changed",
    createdAt: new Date(nowMs - 13 * 60 * 1000).toISOString(),
    taskLabel: "Settings",
    oldValue: "blue",
    newValue: "amber",
  });

  history.sort(
    (left, right) =>
      new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
  activity.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return { history, activity };
}
