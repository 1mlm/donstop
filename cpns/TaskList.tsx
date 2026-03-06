import type { TaskObj } from "@/lib/fake";
import { Task } from "./Task";

export default function TaskList({ tasks }: { tasks: TaskObj[] }) {
  return tasks.map((task) => <Task key={task.id} task={task} />);
}
