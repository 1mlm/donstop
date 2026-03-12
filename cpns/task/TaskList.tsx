import { AnimatePresence, motion } from "motion/react";
import type { TaskID } from "@/lib/store";
import { Task } from "./Task";

export default function TaskList({ taskIDs }: { taskIDs: TaskID[] }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {taskIDs.map((taskID) => (
        <motion.div
          key={taskID}
          layout
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6, scale: 0.98, height: 0, marginTop: 0 }}
          transition={{
            layout: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 },
            duration: 0.14,
            ease: "easeOut",
          }}
        >
          <Task taskID={taskID} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
