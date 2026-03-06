export type TaskObj = {
  id: string;
  label: string;
  parentId?: string;
  position: number;
};

export const FAKE_TASKS: TaskObj[] = [
  {
    id: "1",
    label: "School",
    position: 1,
  },
  { id: "1-1", label: "Physics", parentId: "1", position: 1 },
  { id: "1-1-1", label: "Quantum Mechanics", parentId: "1-1", position: 1 },
  { id: "1-1-2", label: "Thermodynamics", parentId: "1-1", position: 2 },
  { id: "1-2", label: "CS", parentId: "1", position: 2 },
  { id: "1-2-1", label: "Data Structures", parentId: "1-2", position: 1 },
  { id: "1-2-1-1", label: "Binary Trees", parentId: "1-2-1", position: 1 },
  { id: "1-2-1-2", label: "Graphs", parentId: "1-2-1", position: 2 },
  { id: "1-2-2", label: "Algorithms", parentId: "1-2", position: 2 },
  {
    id: "2",
    label: "Chores",
    position: 2,
  },
  { id: "2-1", label: "Laundry", parentId: "2", position: 1 },
  { id: "2-2", label: "Clean Room", parentId: "2", position: 2 },
  { id: "3", label: "Projects", position: 3 },
];
