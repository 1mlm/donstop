import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCancelActiveTaskState,
  computeFinishActiveTaskState,
  getSafeElapsedSeconds,
} from "../lib/store/store-lifecycle.utils.ts";
import {
  computeTransferActiveSession,
  resetActiveSessionStart,
} from "../lib/store/store-session.utils.ts";
import type { TaskObj } from "../lib/types.ts";

function tasks(): TaskObj[] {
  return [
    { id: "source", label: "Source", position: 0, time: 100, isFavorite: true },
    { id: "target", label: "Target", position: 1, time: 200 },
  ];
}

test("getSafeElapsedSeconds computes positive duration", () => {
  const nowMs = new Date("2026-03-12T10:10:00.000Z").getTime();
  const startedAt = "2026-03-12T10:09:20.000Z";

  assert.equal(getSafeElapsedSeconds(startedAt, nowMs), 40);
});

test("getSafeElapsedSeconds returns zero for invalid date", () => {
  assert.equal(getSafeElapsedSeconds("invalid", Date.now()), 0);
});

test("getSafeElapsedSeconds clamps negative durations to zero", () => {
  const nowMs = new Date("2026-03-12T10:00:00.000Z").getTime();
  assert.equal(getSafeElapsedSeconds("2026-03-12T10:01:00.000Z", nowMs), 0);
});

test("computeFinishActiveTaskState returns null when active session is missing", () => {
  const result = computeFinishActiveTaskState(tasks(), null, Date.now());
  assert.equal(result, null);
});

test("computeFinishActiveTaskState marks only active task as finished and clears favorite", () => {
  const nowMs = new Date("2026-03-12T10:10:00.000Z").getTime();
  const result = computeFinishActiveTaskState(
    tasks(),
    { taskId: "source", startedAt: "2026-03-12T10:05:00.000Z" },
    nowMs,
  );

  assert.ok(result);
  const source = result?.nextTasks.find((task) => task.id === "source");
  const target = result?.nextTasks.find((task) => task.id === "target");

  assert.equal(source?.isFinished, true);
  assert.equal(Boolean(source?.finishedAt), true);
  assert.equal(source?.isFavorite, false);
  assert.equal(target?.isFinished, undefined);

  assert.equal(result?.activityItem.kind, "task_finished");
  assert.equal(result?.activityItem.taskLabel, "Source");
  assert.equal(result?.activityItem.taskHistoryEntryID, "source");
  assert.equal(result?.durationSeconds, 300);
});

test("computeCancelActiveTaskState returns null when task is missing", () => {
  const result = computeCancelActiveTaskState(
    tasks(),
    { taskId: "missing", startedAt: "2026-03-12T10:00:00.000Z" },
    Date.now(),
  );

  assert.equal(result, null);
});

test("computeCancelActiveTaskState creates cancel activity with duration", () => {
  const nowMs = new Date("2026-03-12T10:12:00.000Z").getTime();
  const result = computeCancelActiveTaskState(
    tasks(),
    { taskId: "source", startedAt: "2026-03-12T10:10:00.000Z" },
    nowMs,
  );

  assert.ok(result);
  assert.equal(result?.activityItem.kind, "task_cancelled");
  assert.equal(result?.activityItem.taskLabel, "Source");
  assert.equal(result?.activityItem.taskHistoryEntryID, "source");
  assert.equal(result?.durationSeconds, 120);
});

test("flow combination: transfer then reset then finish uses reset timestamp", () => {
  const initial = tasks();
  const start = "2026-03-12T10:00:00.000Z";
  const transferAtMs = new Date("2026-03-12T10:04:00.000Z").getTime();

  const transfer = computeTransferActiveSession(
    { taskId: "source", startedAt: start },
    initial,
    "target",
    transferAtMs,
  );
  assert.ok(transfer);
  assert.equal(transfer?.durationSeconds, 240);

  const resetIso = "2026-03-12T10:09:00.000Z";
  const resetSession = resetActiveSessionStart(
    transfer?.nextActiveSession ?? null,
    resetIso,
  );
  assert.ok(resetSession);

  const finishAtMs = new Date("2026-03-12T10:10:30.000Z").getTime();
  const finished = computeFinishActiveTaskState(
    initial,
    resetSession,
    finishAtMs,
  );

  assert.ok(finished);
  assert.equal(finished?.taskLabel, "Target");
  assert.equal(finished?.durationSeconds, 90);
  assert.equal(finished?.activityItem.kind, "task_finished");
  assert.equal(finished?.activityItem.taskHistoryEntryID, "target");
});

test("flow combination: transfer then cancel applies to new active task", () => {
  const initial = tasks();
  const start = "2026-03-12T10:00:00.000Z";

  const transfer = computeTransferActiveSession(
    { taskId: "source", startedAt: start },
    initial,
    "target",
    new Date("2026-03-12T10:01:00.000Z").getTime(),
  );
  assert.ok(transfer);

  const cancelled = computeCancelActiveTaskState(
    initial,
    transfer?.nextActiveSession ?? null,
    new Date("2026-03-12T10:01:30.000Z").getTime(),
  );

  assert.ok(cancelled);
  assert.equal(cancelled?.taskLabel, "Target");
  assert.equal(cancelled?.activityItem.kind, "task_cancelled");
  assert.equal(cancelled?.activityItem.taskHistoryEntryID, "target");
  assert.equal(cancelled?.durationSeconds, 90);
});
