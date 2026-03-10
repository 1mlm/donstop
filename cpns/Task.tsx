"use client";

import { ChevronDown, Pause, Play } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MOTION_PROPS } from "@/lib/motion";
import { type TaskID, useTODOStore } from "@/lib/store";
import type { TaskObj } from "@/lib/types";
import { formatPreviewTime } from "@/lib/util";
import { Icon } from "./Icon";
import TaskList from "./TaskList";

export function Task({ taskID }: { taskID: TaskID }) {
  const [expanded, setExpanded] = useState(false);
  const [taskData, setTaskData] = useState<TaskObj | null>(null);
  const [taskChildrenIDs, setTaskChildrenIDs] = useState<TaskID[]>([]);

  const getTaskFromID = useTODOStore((s) => s.getTaskFromID);
  const getTaskChildrenIDs = useTODOStore((s) => s.getTaskChildrenIDs);
  const setActiveTaskID = useTODOStore((s) => s.setActiveTaskID);
  const removeActiveTaskID = useTODOStore((s) => s.removeActiveTaskID);
  const isActive = useTODOStore((s) => s.activeTaskID === taskID);

  useEffect(() => {
    setTaskData(getTaskFromID(taskID));
    setTaskChildrenIDs(getTaskChildrenIDs(taskID));
  }, [getTaskChildrenIDs, getTaskFromID, taskID]);

  if (!taskData) return;

  const isParent = taskChildrenIDs.length > 0;
  const time = formatPreviewTime(taskData.time);

  return (
    <div
      className={`flex flex-col
        py-0.5 px-2 pr-2.5
        rounded-2xl
        select-none
        duration-100
        ${expanded && "rounded-tl-md pb-1"}
        ${
          isActive
            ? `bg-primary text-primary-foreground shadow-xl border-2 border-primary font-bold`
            : "bg-primary/5 border hover:translate-x-1 "
        }`}
    >
      <button
        className={`flex items-center justify-between hover-hand gap-2 text-ellipsis
          ${expanded && "pb-1"}`}
        onClick={() => isParent && setExpanded(!expanded)}
      >
        <Icon
          onClick={() =>
            isActive ? removeActiveTaskID() : setActiveTaskID(taskID)
          }
          icon={isActive ? Pause : Play}
          className={`duration-75 hover:fill-primary-foreground
              hover:text-primary-foreground
              hover:scale-115
              hover:rotate-2
              shrink-0`}
        />
        <span className="truncate w-full text-left">
          {taskData.label}
          <span
            className={`pl-1 font-light text-xs
              ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
          >
            {time}
          </span>
        </span>
        {isParent && (
          <Icon
            icon={ChevronDown}
            className={`duration-300 shrink-0 ${expanded ? "-scale-125" : "scale-125"}`}
          />
        )}
      </button>
      <AnimatePresence>
        {isParent && expanded && (
          <motion.div {...MOTION_PROPS} className="flex flex-col pl-3 gap-1">
            <TaskList taskIDs={taskChildrenIDs} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
