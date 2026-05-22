import { HugeiconsIcon as HugeiconsIconBase } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/shadcn/lib/utils";

export const DEFAULT_STROKE_WIDTH = 1.75;

export type HugeIcon = Parameters<typeof HugeiconsIconBase>[0]["icon"];

export function Icon({
  strokeWidth = DEFAULT_STROKE_WIDTH,
  className,
  ...props
}: ComponentProps<typeof HugeiconsIconBase>) {
  return (
    <HugeiconsIconBase
      strokeWidth={strokeWidth}
      {...props}
      className={cn("size-4", className)}
    />
  );
}
