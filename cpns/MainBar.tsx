import { ZzzIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { MOTION_PROPS } from "@/lib/motion";
import { useTODOStore } from "@/lib/store";
import { formatChronoTime } from "@/lib/util";
import { Bar } from "./Bar";
import { Icon } from "./Icon";

export default function MainBar() {
  const activeTaskID = useTODOStore((s) => s.activeTaskID);
  const activeTask = useTODOStore((s) =>
    activeTaskID ? s.getTaskFromID(activeTaskID) : null,
  );

  return (
    <Bar className="flex items-center justify-center">
      <AnimatePresence>
        {activeTask ? (
          <motion.div
            {...MOTION_PROPS}
            key={activeTaskID}
            className="flex flex-col items-center justify-center"
          >
            <h2 key="h2" className="text-3xl text-muted-foreground">
              {activeTask.label}
            </h2>
            <h1 key="h1" className="text-9xl font-bold">
              {formatChronoTime(activeTask.time)}
            </h1>
          </motion.div>
        ) : (
          <motion.div key={"no-active-task"} {...MOTION_PROPS}>
            <Icon
              icon={ZzzIcon}
              className=" size-24 opacity-35 animate-[spin_30s_linear_infinite]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Bar>
  );
}
