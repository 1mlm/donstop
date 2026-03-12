import { motion } from "motion/react";
import { forwardRef, type PropsWithChildren } from "react";
import { cn } from "@/shadcn/lib/utils";

export const Bar = forwardRef<
  HTMLDivElement,
  PropsWithChildren & { className?: string }
>(function Bar({ className, children }, ref) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "flex flex-col size-full rounded-3xl squircle squircle-3xl",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
);
