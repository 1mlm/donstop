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
            layout: { type: "spring", stiffness: 320, damping: 34, mass: 0.85 },
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Task taskID={taskID} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
