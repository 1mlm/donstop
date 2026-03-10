import type { TaskID } from "@/lib/store";
import { Task } from "./Task";

export default function TaskList({ taskIDs }: { taskIDs: TaskID[] }) {
  return taskIDs.map((taskID) => <Task key={taskID} {...{ taskID }} />);
}
