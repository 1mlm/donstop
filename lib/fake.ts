import type { HistoryActivityItem, TaskHistoryEntry, TaskObj } from "./types";

const baseFakeTasks: TaskObj[] = [
  {
    id: "school",
    label: "School",
    position: 1,
    time: 22140,
    isFavorite: true,
  },
  {
    id: "school-chem",
    label: "Chemistry",
    parentId: "school",
    position: 1,
    time: 6420,
  },
  {
    id: "school-chem-lab",
    label: "Lab report: titration",
    parentId: "school-chem",
    position: 1,
    time: 1840,
    isFinished: true,
    finishedAt: "2026-03-09T18:15:00.000Z",
  },
  {
    id: "school-chem-quiz",
    label: "Organic quiz flashcards",
    parentId: "school-chem",
    position: 2,
    time: 920,
  },
  {
    id: "school-math",
    label: "Math",
    parentId: "school",
    position: 2,
    time: 7710,
    isFavorite: true,
  },
  {
    id: "school-math-calc",
    label: "Calculus set 4",
    parentId: "school-math",
    position: 1,
    time: 2010,
  },
  {
    id: "school-math-calc-q1",
    label: "Q1 limits review",
    parentId: "school-math-calc",
    position: 1,
    time: 620,
    isFinished: true,
    finishedAt: "2026-03-10T19:05:00.000Z",
  },
  {
    id: "school-math-calc-q2",
    label: "Q2 optimization",
    parentId: "school-math-calc",
    position: 2,
    time: 540,
  },
  {
    id: "school-math-alg",
    label: "Linear algebra recap",
    parentId: "school-math",
    position: 2,
    time: 980,
  },
  {
    id: "school-history",
    label: "History",
    parentId: "school",
    position: 3,
    time: 3230,
  },
  {
    id: "school-history-essay",
    label: "Essay draft: post-war Europe",
    parentId: "school-history",
    position: 1,
    time: 1540,
    isFinished: true,
    finishedAt: "2026-03-08T16:22:00.000Z",
  },
  {
    id: "school-history-sources",
    label: "Primary source notes",
    parentId: "school-history",
    position: 2,
    time: 870,
  },

  {
    id: "projects",
    label: "Projects",
    position: 2,
    time: 16820,
  },
  {
    id: "projects-github",
    label: "GitHub",
    parentId: "projects",
    position: 1,
    time: 8340,
  },
  {
    id: "projects-github-todo",
    label: "todo-app UI polish",
    parentId: "projects-github",
    position: 1,
    time: 3810,
    isFavorite: true,
  },
  {
    id: "projects-github-prisma",
    label: "prisma-orm migration notes",
    parentId: "projects-github",
    position: 2,
    time: 1520,
  },
  {
    id: "projects-github-ts",
    label: "typescript utility cleanup",
    parentId: "projects-github",
    position: 3,
    time: 1290,
  },
  {
    id: "projects-drawing",
    label: "Drawing",
    parentId: "projects",
    position: 2,
    time: 2260,
    isFinished: true,
    finishedAt: "2026-03-07T20:10:00.000Z",
  },
  {
    id: "projects-drawing-refs",
    label: "Reference board",
    parentId: "projects-drawing",
    position: 1,
    time: 940,
  },

  {
    id: "fitness",
    label: "Workout",
    position: 3,
    time: 3600,
  },

  {
    id: "admin",
    label: "Admin",
    position: 4,
    time: 1420,
    isFinished: true,
    finishedAt: "2026-03-10T10:10:00.000Z",
  },
];

export function createFakeTasks(): TaskObj[] {
  return baseFakeTasks.map((task) => ({ ...task, time: task.time || 0 }));
}

export const FAKE_TASKS: TaskObj[] = createFakeTasks();

function pickCalendarStatus(
  index: number,
): TaskHistoryEntry["calendarSyncStatus"] {
  if (index % 5 === 0) return "failed";
  if (index % 3 === 0) return "synced";
  return "pending";
}

export function createFakeHistoryData(
  tasks: TaskObj[],
  nowMs = Date.now(),
): {
  history: TaskHistoryEntry[];
  activity: HistoryActivityItem[];
} {
  const candidates = tasks
    .filter((task) => task.label.trim().length > 0)
    .slice()
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  if (candidates.length === 0) {
    return { history: [], activity: [] };
  }

  const sessionCount = Math.min(
    10,
    Math.max(5, Math.floor(candidates.length / 2)),
  );
  const history: TaskHistoryEntry[] = [];
  const activity: HistoryActivityItem[] = [];

  const pushActivity = (
    item: Omit<HistoryActivityItem, "id" | "taskHistoryEntryID"> & {
      taskHistoryEntryID?: string;
    },
  ) => {
    activity.push({
      id: crypto.randomUUID(),
      taskHistoryEntryID: item.taskHistoryEntryID || crypto.randomUUID(),
      ...item,
    });
  };

  let cursorMs = nowMs;

  for (let index = 0; index < sessionCount; index += 1) {
    const task = candidates[index % candidates.length];
    const gapSeconds = 4 * 60 + Math.floor(Math.random() * 18 * 60);
    const durationSeconds = 8 * 60 + Math.floor(Math.random() * 92 * 60);

    const endedAtMs = cursorMs - gapSeconds * 1000;
    const startedAtMs = endedAtMs - durationSeconds * 1000;
    const startedAt = new Date(startedAtMs).toISOString();
    const endedAt = new Date(endedAtMs).toISOString();
    const entryId = crypto.randomUUID();

    const historyEntry: TaskHistoryEntry = {
      id: entryId,
      taskId: task.id,
      taskLabel: task.label,
      startedAt,
      endedAt,
      durationSeconds,
      calendarSyncStatus: pickCalendarStatus(index),
    };

    history.push(historyEntry);
    pushActivity({
      kind: "task_started",
      createdAt: startedAt,
      taskLabel: task.label,
      taskHistoryEntryID: entryId,
    });

    pushActivity({
      kind: "task_session",
      createdAt: endedAt,
      taskLabel: task.label,
      taskHistoryEntryID: entryId,
      durationSeconds,
      startedAt,
      endedAt,
    });

    if (index % 3 === 0 && candidates.length > 1) {
      const source = candidates[(index + 1) % candidates.length];
      pushActivity({
        kind: "task_transferred",
        createdAt: new Date(startedAtMs + 45 * 1000).toISOString(),
        taskLabel: task.label,
        sourceTaskLabel: source.label,
        durationSeconds: 60 + (index % 4) * 45,
      });
    }

    if (index % 4 === 0) {
      pushActivity({
        kind: "task_repositioned",
        createdAt: new Date(startedAtMs + 30 * 1000).toISOString(),
        taskLabel: task.label,
        moveDestinationParentLabel:
          index % 2 === 0 ? candidates[0]?.label : undefined,
        moveBeforeTaskLabel: candidates[(index + 2) % candidates.length]?.label,
        moveAfterTaskLabel: candidates[(index + 3) % candidates.length]?.label,
      });
    }

    if (index % 5 === 0) {
      pushActivity({
        kind: "task_finished",
        createdAt: new Date(endedAtMs + 10 * 1000).toISOString(),
        taskLabel: task.label,
        durationSeconds,
        taskHistoryEntryID: entryId,
      });
    }

    cursorMs = startedAtMs;
  }

  const systemMoments = [
    nowMs - 20 * 60 * 1000,
    nowMs - 18 * 60 * 1000,
    nowMs - 17 * 60 * 1000,
    nowMs - 15 * 60 * 1000,
    nowMs - 13 * 60 * 1000,
    nowMs - 10 * 60 * 1000,
    nowMs - 8 * 60 * 1000,
    nowMs - 6 * 60 * 1000,
  ];

  pushActivity({
    kind: "calendar_connected",
    createdAt: new Date(systemMoments[0]).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "student@example.com",
  });
  pushActivity({
    kind: "calendar_enabled",
    createdAt: new Date(systemMoments[1]).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "DonStop",
  });
  pushActivity({
    kind: "settings_cursor_disabled",
    createdAt: new Date(systemMoments[2]).toISOString(),
    taskLabel: "Settings",
  });
  pushActivity({
    kind: "settings_cursor_enabled",
    createdAt: new Date(systemMoments[3]).toISOString(),
    taskLabel: "Settings",
  });
  pushActivity({
    kind: "settings_primary_color_changed",
    createdAt: new Date(systemMoments[4]).toISOString(),
    taskLabel: "Settings",
    oldValue: "blue",
    newValue: "amber",
  });
  pushActivity({
    kind: "calendar_disabled",
    createdAt: new Date(systemMoments[5]).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "DonStop",
  });
  pushActivity({
    kind: "calendar_target_changed",
    createdAt: new Date(systemMoments[6] - 45 * 1000).toISOString(),
    taskLabel: "Google Calendar",
    oldValue: "DonStop",
    newValue: "School",
  });
  pushActivity({
    kind: "calendar_enabled",
    createdAt: new Date(systemMoments[6]).toISOString(),
    taskLabel: "Google Calendar",
    subjectLabel: "DonStop",
  });
  pushActivity({
    kind: "calendar_disconnected",
    createdAt: new Date(systemMoments[7]).toISOString(),
    taskLabel: "Google Calendar",
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
