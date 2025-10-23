"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-background text-foreground shadow-elevated",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

export const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm text-muted-foreground">
    <Search className="h-4 w-4" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground", className)}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn("max-h-[360px] overflow-y-auto", className)} {...props} />
));
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = CommandPrimitive.Empty;
export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn("px-2 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground", className)}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "group flex cursor-pointer select-none items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[selected]:bg-accent",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("mx-2 my-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export const CommandShortcuts = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("ml-auto flex items-center gap-1 text-xs text-muted-foreground", className)} {...props} />
);
