import { FAKE_TASKS } from "@/lib/fake";
import { Bar } from "./Bar";
import { Task } from "./Task";

export default function TaskBar() {
  const rootTasks = FAKE_TASKS.filter((task) => !task.parentId).sort(
    (a, b) => a.position - b.position,
  );

  return (
    <Bar className="p-3 overflow-y-auto space-y-1">
      {rootTasks.map((task) => (
        <Task key={task.id} task={task} />
      ))}
    </Bar>
  );
}
