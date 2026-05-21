import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTaskMovePlan,
  computeTaskMovePlan,
  createTaskRepositionActivity,
} from "../lib/store/store-move.ts";
import type { TaskObj } from "../lib/types.ts";

function baseTasks(): TaskObj[] {
  return [
    { id: "a", label: "A", position: 0, time: 0 },
    { id: "b", label: "B", position: 1, time: 0 },
    { id: "c", label: "C", position: 2, time: 0 },
    { id: "d", label: "D", position: 3, time: 0 },
  ];
}

function findTask(tasks: TaskObj[], id: string) {
  const item = tasks.find((task) => task.id === id);
  assert.ok(item, `Missing task ${id}`);
  return item;
}

test("computeTaskMovePlan before reorders correctly", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "c");
  const targetTask = findTask(tasks, "a");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.ok(plan);
  assert.equal(plan.destinationPositionByID.get("c"), 0);
  assert.equal(plan.destinationPositionByID.get("a"), 1);
  assert.equal(plan.destinationPositionByID.get("b"), 2);
  assert.equal(plan.destinationPositionByID.get("d"), 3);
  assert.equal(plan.movedTaskBefore, undefined);
  assert.equal(plan.movedTaskAfter, "A");
});

test("computeTaskMovePlan after reorders correctly", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "a");
  const targetTask = findTask(tasks, "c");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "after");

  assert.ok(plan);
  assert.equal(plan.destinationPositionByID.get("b"), 0);
  assert.equal(plan.destinationPositionByID.get("c"), 1);
  assert.equal(plan.destinationPositionByID.get("a"), 2);
  assert.equal(plan.destinationPositionByID.get("d"), 3);
  assert.equal(plan.movedTaskBefore, "C");
  assert.equal(plan.movedTaskAfter, "D");
});

test("computeTaskMovePlan returns null when target not found", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "a");
  const targetTask = { id: "z", label: "Z", position: 99, time: 0 };

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.equal(plan, null);
});

test("computeTaskMovePlan returns null for no-op reorder", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "a");
  const targetTask = findTask(tasks, "b");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.equal(plan, null);
});

test("applyTaskMovePlan updates positions and preserves untouched tasks", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "c");
  const targetTask = findTask(tasks, "a");
  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");
  assert.ok(plan);

  const next = applyTaskMovePlan(tasks, plan);

  assert.equal(findTask(next, "c").position, 0);
  assert.equal(findTask(next, "a").position, 1);
  assert.equal(findTask(next, "b").position, 2);
  assert.equal(findTask(next, "d").position, 3);
});

test("createTaskRepositionActivity maps move metadata", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "c");
  const targetTask = findTask(tasks, "a");
  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");
  assert.ok(plan);

  const activity = createTaskRepositionActivity("c", "C", plan);

  assert.equal(activity.kind, "task_repositioned");
  assert.equal(activity.taskHistoryEntryID, "c");
  assert.equal(activity.taskLabel, "C");
  assert.equal(activity.moveBeforeTaskLabel, undefined);
  assert.equal(activity.moveAfterTaskLabel, "A");
  assert.ok(activity.id.startsWith("task-repositioned-"));
});
