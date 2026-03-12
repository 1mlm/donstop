import assert from "node:assert/strict";
import test from "node:test";
import {
  computeTransferActiveSession,
  resetActiveSessionStart,
  resetTaskDurationInList,
} from "../lib/store/store-session.utils.ts";

test("computeTransferActiveSession returns null with no active session", () => {
  const result = computeTransferActiveSession(null, [], "target");
  assert.equal(result, null);
});

test("computeTransferActiveSession returns null when source task is missing", () => {
  const result = computeTransferActiveSession(
    { taskId: "missing", startedAt: "2026-03-12T10:00:00.000Z" },
    [{ id: "target", label: "Target" }],
    "target",
  );

  assert.equal(result, null);
});

test("computeTransferActiveSession returns null when target task is missing", () => {
  const result = computeTransferActiveSession(
    { taskId: "source", startedAt: "2026-03-12T10:00:00.000Z" },
    [{ id: "source", label: "Source" }],
    "target",
  );

  assert.equal(result, null);
});

test("computeTransferActiveSession preserves startedAt and computes duration", () => {
  const nowMs = new Date("2026-03-12T10:10:00.000Z").getTime();
  const startedAt = "2026-03-12T10:05:30.000Z";

  const result = computeTransferActiveSession(
    { taskId: "source", startedAt },
    [
      { id: "source", label: "Source" },
      { id: "target", label: "Target" },
    ],
    "target",
    nowMs,
  );

  assert.ok(result);
  assert.equal(result?.nextActiveSession.taskId, "target");
  assert.equal(result?.nextActiveSession.startedAt, startedAt);
  assert.equal(result?.sourceTaskLabel, "Source");
  assert.equal(result?.targetTaskLabel, "Target");
  assert.equal(result?.durationSeconds, 270);
});

test("computeTransferActiveSession clamps negative durations to zero", () => {
  const nowMs = new Date("2026-03-12T10:00:00.000Z").getTime();

  const result = computeTransferActiveSession(
    { taskId: "source", startedAt: "2026-03-12T10:05:00.000Z" },
    [
      { id: "source", label: "Source" },
      { id: "target", label: "Target" },
    ],
    "target",
    nowMs,
  );

  assert.equal(result?.durationSeconds, 0);
});

test("computeTransferActiveSession handles invalid startedAt safely", () => {
  const nowMs = new Date("2026-03-12T10:00:00.000Z").getTime();

  const result = computeTransferActiveSession(
    { taskId: "source", startedAt: "not-a-date" },
    [
      { id: "source", label: "Source" },
      { id: "target", label: "Target" },
    ],
    "target",
    nowMs,
  );

  assert.equal(result?.durationSeconds, 0);
});

test("resetTaskDurationInList resets only the selected task", () => {
  const input = [
    { id: "a", time: 100, label: "A" },
    { id: "b", time: 200, label: "B" },
    { id: "c", time: 300, label: "C" },
  ];

  const output = resetTaskDurationInList(input, "b");

  assert.equal(output[0]?.time, 100);
  assert.equal(output[1]?.time, 0);
  assert.equal(output[2]?.time, 300);
});

test("resetTaskDurationInList keeps array shape when id is not found", () => {
  const input = [
    { id: "a", time: 100 },
    { id: "b", time: 200 },
  ];

  const output = resetTaskDurationInList(input, "missing");

  assert.deepEqual(output, input);
});

test("resetActiveSessionStart returns null for missing active session", () => {
  const result = resetActiveSessionStart(null, "2026-03-12T10:00:00.000Z");
  assert.equal(result, null);
});

test("resetActiveSessionStart keeps task id and replaces startedAt", () => {
  const result = resetActiveSessionStart(
    { taskId: "task-1", startedAt: "2026-03-12T09:59:00.000Z" },
    "2026-03-12T10:00:00.000Z",
  );

  assert.deepEqual(result, {
    taskId: "task-1",
    startedAt: "2026-03-12T10:00:00.000Z",
  });
});
