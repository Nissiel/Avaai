"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white shadow-elevated hover:bg-brand-600 hover:shadow-lg active:scale-[0.995]",
        secondary: "bg-accent text-accent-foreground hover:bg-accent/80",
        outline: "border-border bg-background hover:bg-accent/60 hover:text-foreground",
        ghost: "bg-transparent hover:bg-accent/60 text-foreground",
        subtle: "bg-brand-500/10 text-brand-600 hover:bg-brand-500/15",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "bg-transparent text-brand-500 underline-offset-4 hover:underline",
        muted: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        xs: "h-8 rounded-xl px-3 text-xs",
        sm: "h-9 rounded-xl px-3.5 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        xl: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
      isRounded: {
        true: "rounded-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      isRounded: false,
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isRounded, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(buttonVariants({ variant, size, isRounded, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
