import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  bleed?: boolean;
}

export function Card({ className, interactive, bleed, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-3xl border border-border/70 bg-card/80 p-6 text-base shadow-subtle transition-all duration-200",
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-elevated hover:border-brand-500/40 focus-within:-translate-y-0.5 focus-within:shadow-elevated",
        bleed && "px-0",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-[-0.02em] text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-col gap-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col gap-3 sm:flex-row sm:items-center", className)} {...props} />;
}
