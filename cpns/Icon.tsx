import { HugeiconsIcon as HugeiconsIconBase } from "@hugeicons/react";
import type { ComponentProps } from "react";

export const DEFAULT_STROKE_WIDTH = 1.75;

type IconProps = ComponentProps<typeof HugeiconsIconBase>;

export function Icon({
  strokeWidth = DEFAULT_STROKE_WIDTH,
  ...props
}: IconProps) {
  return <HugeiconsIconBase strokeWidth={strokeWidth} {...props} />;
}
