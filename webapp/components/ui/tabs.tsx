"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-muted/70 p-1 text-sm",
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-ring",
      className,
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn("mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500", className)}
    {...props}
  />
);
