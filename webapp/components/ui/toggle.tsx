"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "@/lib/utils";

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, pressed, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    pressed={pressed}
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium transition-colors data-[state=on]:border-brand-500 data-[state=on]:bg-brand-500/10 data-[state=on]:text-brand-600",
      className,
    )}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
