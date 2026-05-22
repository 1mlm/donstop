"use client";

import { PartyIcon, SleepingIcon, StopIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useActiveTaskSummary } from "@/lib/active-task.hooks";
import { MOTION_PROPS } from "@/lib/motion";
import { useTODOStore } from "@/lib/store";
import { formatPreviewTime } from "@/lib/util";
import { Button } from "@/shadcn/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
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
    <TooltipProvider>
      <motion.div
        {...MOTION_PROPS}
        key={activeTaskSummary.activeTask.id}
        className="flex flex-col items-center justify-center"
      >
        <h2 key="active-label" className="text-2xl font-medium text-foreground">
          {activeTaskSummary.activeTask.label}
        </h2>
        <div
          key="active-time-row"
          className="mt-2 flex items-center justify-center gap-3"
        >
          {activeTaskSummary.storedSeconds > 0 ? (
            <p
              key="active-stored-time"
              className="text-sm text-muted-foreground"
            >
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onStop}
                aria-label="Stop task"
                className="size-16 rounded-full"
              >
                <Icon icon={StopIcon} className="size-7" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop task</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onFinish}
                aria-label="Finish task"
                className="size-16 rounded-full"
              >
                <Icon icon={PartyIcon} className="size-7" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Finish task · Ctrl+Enter</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
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
