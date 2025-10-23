"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const Progress = ({ className, value = 0, ...props }: ProgressPrimitive.ProgressProps) => (
  <ProgressPrimitive.Root
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    value={value}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-brand-500 transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
);
