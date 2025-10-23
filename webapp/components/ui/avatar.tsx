"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export const Avatar = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/70 bg-muted",
      className,
    )}
    {...props}
  />
);

export const AvatarImage = AvatarPrimitive.Image;

export const AvatarFallback = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn("flex h-full w-full items-center justify-center bg-muted text-sm font-semibold text-muted-foreground", className)}
    {...props}
  />
);
