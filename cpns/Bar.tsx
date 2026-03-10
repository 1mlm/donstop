import { motion } from "motion/react";
import type { PropsWithChildren } from "react";
import { cn } from "@/shadcn/lib/utils";

export function Bar({
  className,
  children,
}: PropsWithChildren & { className?: string }) {
  return (
    <motion.div
      className={cn("flex flex-col size-full rounded-3xl", className)}
    >
      {children}
    </motion.div>
  );
}
