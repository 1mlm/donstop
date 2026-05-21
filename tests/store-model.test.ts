import assert from "node:assert/strict";
import test from "node:test";
import type { TaskObj } from "../lib/types.ts";

// sortByPosition: lastActivatedAt desc, position tiebreaker
function sortByPosition(left: TaskObj, right: TaskObj) {
  const lt = left.lastActivatedAt
    ? new Date(left.lastActivatedAt).getTime()
    : 0;
  const rt = right.lastActivatedAt
    ? new Date(right.lastActivatedAt).getTime()
    : 0;
  if (lt !== rt) return rt - lt;
  return left.position - right.position;
}

function task(overrides: Partial<TaskObj> & { id: string }): TaskObj {
  return { label: overrides.id, position: 0, time: 0, ...overrides };
}

test("sortByPosition: position tiebreaker when neither has lastActivatedAt", () => {
  const a = task({ id: "a", position: 0 });
  const b = task({ id: "b", position: 1 });
  assert.ok(sortByPosition(a, b) < 0);
  assert.ok(sortByPosition(b, a) > 0);
});

test("sortByPosition: newer lastActivatedAt sorts first", () => {
  const older = task({
    id: "older",
    position: 0,
    lastActivatedAt: "2026-01-01T10:00:00Z",
  });
  const newer = task({
    id: "newer",
    position: 1,
    lastActivatedAt: "2026-01-02T10:00:00Z",
  });
  assert.ok(sortByPosition(newer, older) < 0, "newer before older");
  assert.ok(sortByPosition(older, newer) > 0, "older after newer");
});

test("sortByPosition: activated task sorts before never-activated", () => {
  const activated = task({
    id: "activated",
    position: 1,
    lastActivatedAt: "2026-01-01T10:00:00Z",
  });
  const never = task({ id: "never", position: 0 });
  assert.ok(sortByPosition(activated, never) < 0);
});

test("sortByPosition: equal lastActivatedAt falls back to position", () => {
  const ts = "2026-01-01T10:00:00Z";
  const a = task({ id: "a", position: 0, lastActivatedAt: ts });
  const b = task({ id: "b", position: 1, lastActivatedAt: ts });
  assert.ok(sortByPosition(a, b) < 0);
});

test("sortByPosition: section order preserved for never-activated tasks", () => {
  const sec1 = task({ id: "sec1", position: 0 });
  const sec2 = task({ id: "sec2", position: 1 });
  const sec3 = task({ id: "sec3", position: 2 });
  const sorted = [sec3, sec1, sec2].sort(sortByPosition);
  assert.deepEqual(
    sorted.map((t) => t.id),
    ["sec1", "sec2", "sec3"],
  );
});
