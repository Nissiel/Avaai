"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuPortal = DropdownPrimitive.Portal;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuContent = ({ className, sideOffset = 10, ...props }: DropdownPrimitive.DropdownMenuContentProps) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[220px] overflow-hidden rounded-2xl border border-border/70 bg-background p-2 text-sm shadow-elevated",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);

export const DropdownMenuItem = ({ className, inset, ...props }: DropdownPrimitive.DropdownMenuItemProps & { inset?: boolean }) => (
  <DropdownPrimitive.Item
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
);

export const DropdownMenuLabel = ({ className, inset, ...props }: DropdownPrimitive.DropdownMenuLabelProps & { inset?: boolean }) => (
  <DropdownPrimitive.Label
    className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground", inset && "pl-8", className)}
    {...props}
  />
);

export const DropdownMenuSeparator = ({ className, ...props }: DropdownPrimitive.DropdownMenuSeparatorProps) => (
  <DropdownPrimitive.Separator className={cn("my-2 h-px bg-border", className)} {...props} />
);

export const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
);

export const DropdownMenuCheckboxItem = ({ className, children, checked, ...props }: DropdownPrimitive.DropdownMenuCheckboxItemProps) => (
  <DropdownPrimitive.CheckboxItem
    className={cn(
      "relative flex select-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-accent",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    <span className="pl-6">{children}</span>
  </DropdownPrimitive.CheckboxItem>
);

export const DropdownMenuRadioItem = ({ className, children, ...props }: DropdownPrimitive.DropdownMenuRadioItemProps) => (
  <DropdownPrimitive.RadioItem
    className={cn(
      "relative flex select-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-accent",
      className,
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    <span className="pl-6">{children}</span>
  </DropdownPrimitive.RadioItem>
);

export const DropdownMenuSubTrigger = ({ className, inset, children, ...props }: DropdownPrimitive.DropdownMenuSubTriggerProps & { inset?: boolean }) => (
  <DropdownPrimitive.SubTrigger
    className={cn(
      "flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition data-[state=open]:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownPrimitive.SubTrigger>
);

export const DropdownMenuSubContent = ({ className, ...props }: DropdownPrimitive.DropdownMenuSubContentProps) => (
  <DropdownPrimitive.SubContent
    className={cn("z-50 min-w-[220px] overflow-hidden rounded-2xl border border-border/70 bg-background p-2 text-sm shadow-elevated", className)}
    {...props}
  />
);
