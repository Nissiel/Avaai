import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        brand: "bg-brand-500/15 text-brand-700",
        accent: "bg-accent text-accent-foreground",
        outline: "border-border text-foreground",
        success: "bg-status-success/15 text-status-success",
        warning: "bg-status-warning/15 text-status-warning",
        danger: "bg-status-danger/15 text-status-danger",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
