"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export const ScrollArea = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>) => (
  <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-2xl">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar
      className="flex touch-none select-none rounded-full border border-transparent bg-muted/60 p-[2px] transition-colors hover:bg-muted"
      orientation="vertical"
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Scrollbar
      className="flex touch-none select-none rounded-full border border-transparent bg-muted/60 p-[2px] transition-colors hover:bg-muted"
      orientation="horizontal"
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Corner className="bg-muted" />
  </ScrollAreaPrimitive.Root>
);
