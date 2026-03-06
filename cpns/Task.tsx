"use client";

import { ChevronDown, PlayIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FAKE_TASKS, type TaskObj } from "@/lib/fake";
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
      className={`flex flex-col gap-1.5 pt-0.5 px-2 pr-2.5 pb-1
        rounded-2xl
        ${expanded && "rounded-tl-md"}
        select-none
        border
        hover-hand hover:translate-x-1 duration-75 bg-primary/5`}
    >
      <div className="flex items-center justify-between">
        <span className="flex gap-2 items-center">
          <Icon icon={PlayIcon} />
          {task.label}
        </span>
        {isParent && (
          <Icon
            icon={ChevronDown}
            // Make the width -100% so it doesn't rotate, just switches from pointing down to pointing up
            className={`duration-200 ${expanded ? "scale-[-100%]" : "scale-100"}`}
            onClick={() => setExpanded(!expanded)}
          />
        )}
      </div>
      <AnimatePresence>
        {isParent && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col pl-3 gap-1"
          >
            <TaskList tasks={children} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
