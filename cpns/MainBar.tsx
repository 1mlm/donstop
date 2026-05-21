"use client";

import {
  ArrowRight01Icon,
  PartyIcon,
  SleepingIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { MOTION_PROPS } from "@/lib/motion";
import { useTODOStore } from "@/lib/store";
import { useActiveTaskSummary } from "@/lib/task.hooks";
import { formatPreviewTime } from "@/lib/util";
import { Button } from "@/shadcn/ui/button";
import { Bar } from "./Bar";
import { Icon } from "./Icon";

function formatElapsed(seconds: number) {
  return formatPreviewTime(seconds) ?? "0s";
}

function IdleTaskState() {
  return (
    <motion.div key="no-active-task" {...MOTION_PROPS}>
      <Icon icon={SleepingIcon} className="size-24 opacity-35" />
    </motion.div>
  );
}

type ActiveTaskSummary = NonNullable<ReturnType<typeof useActiveTaskSummary>>;

function ActiveTaskState({
  activeTaskSummary,
  onStop,
  onFinish,
}: {
  activeTaskSummary: ActiveTaskSummary;
  onStop: () => void;
  onFinish: () => void;
}) {
  return (
    <motion.div
      {...MOTION_PROPS}
      key={activeTaskSummary.activeTask.id}
      className="flex flex-col items-center justify-center"
    >
      {activeTaskSummary.parentPath.length > 0 ? (
        <div
          key="active-parent-path"
          className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"
        >
          {activeTaskSummary.parentPath.map((parentTask) => (
            <span
              key={parentTask.key}
              className="inline-flex items-center gap-1"
            >
              <span>{parentTask.label}</span>
              <Icon icon={ArrowRight01Icon} className="size-3.5" />
            </span>
          ))}
        </div>
      ) : null}
      <h2 key="active-label" className="text-2xl font-medium text-foreground">
        {activeTaskSummary.activeTask.label}
      </h2>
      <div
        key="active-time-row"
        className="mt-2 flex items-center justify-center gap-3"
      >
        {activeTaskSummary.storedSeconds > 0 ? (
          <p key="active-stored-time" className="text-sm text-muted-foreground">
            {formatElapsed(activeTaskSummary.storedSeconds)} +
          </p>
        ) : null}
        <h1
          key="active-running-time"
          className="text-8xl font-bold leading-none"
        >
          {formatElapsed(activeTaskSummary.runningSeconds)}
        </h1>
      </div>
      <div key="active-controls" className="mt-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onStop}
          aria-label="Stop task"
          className="size-16 rounded-full"
        >
          <Icon icon={StopIcon} className="size-7" />
        </Button>
        <Button
          size="icon"
          onClick={onFinish}
          aria-label="Finish task"
          className="size-16 rounded-full"
        >
          <Icon icon={PartyIcon} className="size-7" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function MainBar() {
  const activeTaskSummary = useActiveTaskSummary();
  const stopActiveTask = useTODOStore((s) => s.stopActiveTask);
  const finishActiveTask = useTODOStore((s) => s.finishActiveTask);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        finishActiveTask();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishActiveTask]);

  return (
    <Bar className="flex items-center justify-center">
      <AnimatePresence>
        {activeTaskSummary ? (
          <ActiveTaskState
            activeTaskSummary={activeTaskSummary}
            onStop={stopActiveTask}
            onFinish={finishActiveTask}
          />
        ) : (
          <IdleTaskState />
        )}
      </AnimatePresence>
    </Bar>
  );
}
