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
    { id: "p", label: "Parent", position: 3, time: 0 },
    { id: "x", label: "X", parentId: "p", position: 0, time: 0 },
    { id: "y", label: "Y", parentId: "p", position: 1, time: 0 },
    {
      id: "u",
      label: "Unrelated",
      parentId: "independent",
      position: 7,
      time: 0,
    },
  ];
}

function findTask(tasks: TaskObj[], id: string) {
  const item = tasks.find((task) => task.id === id);
  assert.ok(item, `Missing task ${id}`);
  return item;
}

test("computeTaskMovePlan before in same parent reorders siblings", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "c");
  const targetTask = findTask(tasks, "a");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.ok(plan);
  assert.equal(plan.destinationParentID, undefined);
  assert.equal(plan.oldParentID, undefined);
  assert.equal(plan.previousSiblingPositionByID, null);
  assert.equal(plan.destinationPositionByID.get("c"), 0);
  assert.equal(plan.destinationPositionByID.get("a"), 1);
  assert.equal(plan.destinationPositionByID.get("b"), 2);
  assert.equal(plan.movedTaskBefore, undefined);
  assert.equal(plan.movedTaskAfter, "A");
});

test("computeTaskMovePlan returns null when target is missing from destination siblings", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "a");
  const targetTask = { ...findTask(tasks, "x"), parentId: "other" };

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.equal(plan, null);
});

test("computeTaskMovePlan inside move to subtask inserts at start", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "b");
  const targetTask = findTask(tasks, "p");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "inside");

  assert.ok(plan);
  assert.equal(plan.destinationParentID, "p");
  assert.equal(plan.destinationParentLabel, "Parent");
  assert.equal(plan.destinationPositionByID.get("b"), 0);
  assert.equal(plan.destinationPositionByID.get("x"), 1);
  assert.equal(plan.destinationPositionByID.get("y"), 2);
  assert.equal(plan.movedTaskBefore, undefined);
  assert.equal(plan.movedTaskAfter, "X");
});

test("computeTaskMovePlan cross-parent captures previous sibling reindex", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "x");
  const targetTask = findTask(tasks, "b");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "after");

  assert.ok(plan);
  assert.equal(plan.oldParentID, "p");
  assert.equal(plan.destinationParentID, undefined);
  assert.ok(plan.previousSiblingPositionByID);
  assert.equal(plan.previousSiblingPositionByID?.get("y"), 0);
  assert.equal(plan.destinationPositionByID.get("a"), 0);
  assert.equal(plan.destinationPositionByID.get("b"), 1);
  assert.equal(plan.destinationPositionByID.get("x"), 2);
  assert.equal(plan.destinationPositionByID.get("c"), 3);
});

test("computeTaskMovePlan returns null for no-op reorder", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "a");
  const targetTask = findTask(tasks, "b");

  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "before");

  assert.equal(plan, null);
});

test("applyTaskMovePlan updates only affected siblings and preserves unrelated task", () => {
  const tasks = baseTasks();
  const movingTask = findTask(tasks, "x");
  const targetTask = findTask(tasks, "b");
  const plan = computeTaskMovePlan(tasks, movingTask, targetTask, "after");
  assert.ok(plan);

  const next = applyTaskMovePlan(tasks, plan);

  const moved = findTask(next, "x");
  const y = findTask(next, "y");
  const unrelated = findTask(next, "u");

  assert.equal(moved.parentId, undefined);
  assert.equal(moved.position, 2);
  assert.equal(y.parentId, "p");
  assert.equal(y.position, 0);
  assert.equal(unrelated.parentId, "independent");
  assert.equal(unrelated.position, 7);
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
  assert.equal(activity.moveDestinationParentLabel, undefined);
  assert.ok(activity.id.startsWith("task-repositioned-"));
});
