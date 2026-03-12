import { ArrowRight01Icon, SleepingIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useActiveTaskSummary } from "@/lib/live-task";
import { MOTION_PROPS } from "@/lib/motion";
import { formatPreviewTime } from "@/lib/util";
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
}: {
  activeTaskSummary: ActiveTaskSummary;
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
            <span key={parentTask.key} className="inline-flex items-center gap-1">
              <span>{parentTask.label}</span>
              <Icon icon={ArrowRight01Icon} className="size-3.5" />
            </span>
          ))}
        </div>
      ) : null}
      <h2 key="active-label" className="text-3xl text-muted-foreground">
        {activeTaskSummary.activeTask.label}
      </h2>
      <div key="active-time-row" className="mt-2 flex items-center justify-center gap-3">
        <p key="active-stored-time" className="text-sm text-muted-foreground">
          {formatElapsed(activeTaskSummary.storedSeconds)} +
        </p>
        <h1 key="active-running-time" className="text-9xl font-bold leading-none">
          {formatElapsed(activeTaskSummary.runningSeconds)}
        </h1>
      </div>
    </motion.div>
  );
}

export default function MainBar() {
  const activeTaskSummary = useActiveTaskSummary();

  return (
    <Bar className="flex items-center justify-center">
      <AnimatePresence>
        {activeTaskSummary ? (
          <ActiveTaskState activeTaskSummary={activeTaskSummary} />
        ) : (
          <IdleTaskState />
        )}
      </AnimatePresence>
    </Bar>
  );
}
