"use client";

import { ChevronDown, PlayIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FAKE_TASKS } from "@/lib/fake";
import { MOTION_PROPS } from "@/lib/motion";
import type { TaskObj } from "@/lib/types";
import { Icon } from "./Icon";
import TaskList from "./TaskList";

export function Task({ task }: { task: TaskObj }) {
  const [expanded, setExpanded] = useState(false);
  const children = FAKE_TASKS.filter((t) => t.parentId === task.id).sort(
    (a, b) => a.position - b.position,
  );
  const isParent = children.length > 0;
  return (
    <div
      className={`flex flex-col gap-1.5 py-0.5 px-2 pr-2.5
        rounded-2xl
        ${expanded && "rounded-tl-md pb-1"}
        select-none
        border
        hover-hand hover:translate-x-1 duration-75 bg-primary/5`}
    >
      <button
        className="flex items-center justify-between"
        onClick={() => isParent && setExpanded(!expanded)}
      >
        <span className="flex gap-2 items-center text-ellipsis text-nowrap">
          <Icon icon={PlayIcon} />
          {task.label}
        </span>
        {isParent && (
          <Icon
            icon={ChevronDown}
            className={`duration-200 ${expanded ? "scale-[-120%]" : "scale-120"}`}
          />
        )}
      </button>
      <AnimatePresence>
        {isParent && expanded && (
          <motion.div {...MOTION_PROPS} className="flex flex-col pl-3 gap-1">
            <TaskList tasks={children} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
