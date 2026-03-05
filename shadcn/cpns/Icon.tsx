import type { ComponentProps } from "react"
import { HugeiconsIcon as HugeiconsIconBase } from "@hugeicons/react"

export const DEFAULT_STROKE_WIDTH = 2

type IconProps = ComponentProps<typeof HugeiconsIconBase>

export function Icon({ strokeWidth = DEFAULT_STROKE_WIDTH, ...props }: IconProps) {
  return <HugeiconsIconBase strokeWidth={strokeWidth} {...props} />
}
