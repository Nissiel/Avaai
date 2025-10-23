"use client";

import * as DrawerPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;
export const DrawerPortal = DrawerPrimitive.Portal;

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[95vh] min-h-[40vh] flex-col rounded-t-3xl border border-border/70 bg-background p-6 shadow-elevated",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" aria-hidden />
      {children}
      <DrawerPrimitive.Close className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DrawerPrimitive.Close>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-2 flex flex-col gap-2", className)} {...props} />
);

export const DrawerTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold tracking-[-0.02em]", className)} {...props} />
);

export const DrawerDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
