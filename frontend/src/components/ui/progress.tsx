"use client"

import * as React from "react"
import { cn } from "cn"

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number
  indicatorClassName?: string
}) {
  const clamped = Math.min(100, Math.max(0, value ?? 0))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 bg-primary transition-transform duration-300 ease-out",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  )
}

export { Progress }