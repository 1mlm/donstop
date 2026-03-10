import type { TaskObj } from "./types";

export const FAKE_TASKS: TaskObj[] = [
  {
    id: "1",
    label: "School",
    position: 1,
    time: 924,
  },
  { id: "1-1", label: "Physics", parentId: "1", position: 1, time: 2959 },
  {
    id: "1-1-1",
    label: "Quantum Mechanics",
    parentId: "1-1",
    position: 1,
    time: 13,
  },
  {
    id: "1-1-2",
    label: "Thermodynamics",
    parentId: "1-1",
    position: 2,
    time: 29482,
  },
  { id: "1-2", label: "CS", parentId: "1", position: 2 },
  { id: "1-2-1", label: "Data Structures", parentId: "1-2", position: 1 },
  { id: "1-2-1-1", label: "Binary Trees", parentId: "1-2-1", position: 1 },
  { id: "1-2-1-2", label: "Graphs", parentId: "1-2-1", position: 2 },
  { id: "1-2-2", label: "Algorithms", parentId: "1-2", position: 2 },
  {
    id: "2",
    label: "Chores",
    position: 2,
    time: 9242,
  },
  { id: "2-1", label: "Laundry", parentId: "2", position: 1 },
  { id: "2-2", label: "Clean Room", parentId: "2", position: 2 },
  { id: "3", label: "Other Projects", position: 3 },
].map((c) => ({ ...c, time: c.time || 0 }));
