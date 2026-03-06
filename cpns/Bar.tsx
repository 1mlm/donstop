import type { PropsWithChildren } from "react";
import { cn } from "@/shadcn/lib/utils";

export function Bar({
  className,
  children,
}: PropsWithChildren & { className?: string }) {
  return (
    <div
      className={cn("flex flex-col size-full bg-card rounded-3xl", className)}
    >
      {children}
    </div>
  );
}
