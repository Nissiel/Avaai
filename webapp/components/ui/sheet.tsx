"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", className)}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: "left" | "right" | "top" | "bottom";
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid max-h-screen w-full gap-8 border border-border/70 bg-background p-8 shadow-elevated focus-visible:outline-none",
        side === "right" && "inset-y-0 right-0 max-w-[480px] rounded-l-3xl",
        side === "left" && "inset-y-0 left-0 max-w-[480px] rounded-r-3xl",
        side === "top" && "inset-x-0 top-0 max-h-[80vh] rounded-b-3xl",
        side === "bottom" && "inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl",
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2", className)} {...props} />
);

export const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-xl font-semibold tracking-[-0.02em]", className)} {...props} />
);

export const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
