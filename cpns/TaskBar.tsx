import { useEffect, useState } from "react";
import { type TaskID, useTODOStore } from "@/lib/store";
import { Bar } from "./Bar";
import { Task } from "./Task";

export default function TaskBar() {
  const [rootTaskIDs, setRootTaskIDs] = useState<TaskID[]>([]);
  const getRootTaskIDs = useTODOStore((state) => state.getRootTaskIDs);

  useEffect(() => setRootTaskIDs(getRootTaskIDs()), [getRootTaskIDs]);

  return (
    <Bar className="p-3 overflow-y-auto space-y-1">
      {rootTaskIDs.map((taskID) => (
        <Task key={taskID} {...{ taskID }} />
      ))}
    </Bar>
  );
}
