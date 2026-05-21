"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    function applyMobileLayout() {
      if (!el) return
      // Radix wraps content in a [data-radix-popper-content-wrapper] div and
      // sets left/top/transform inline via floating-ui. On mobile we grab that
      // wrapper and override those inline styles to center it like a modal.
      const wrapper = el.closest<HTMLElement>(
        "[data-radix-popper-content-wrapper]",
      )
      if (!wrapper) return
      const isMobile = window.matchMedia("(max-width: 767px)").matches
      if (isMobile) {
        wrapper.style.position = "fixed"
        wrapper.style.left = "50%"
        wrapper.style.top = "50%"
        wrapper.style.transform = "translate(-50%, -50%)"
        wrapper.style.margin = "0"
        el.style.width = "calc(100vw - 2rem)"
        el.style.maxWidth = "28rem"
        el.style.maxHeight = "85dvh"
        el.style.overflowY = "auto"
      } else {
        wrapper.style.cssText = ""
        el.style.cssText = ""
      }
    }

    applyMobileLayout()
    const mq = window.matchMedia("(max-width: 767px)")
    mq.addEventListener("change", applyMobileLayout)
    return () => mq.removeEventListener("change", applyMobileLayout)
  }, [])

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-xl bg-popover/95 p-2.5 text-sm text-popover-foreground shadow-xl backdrop-blur-sm ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
