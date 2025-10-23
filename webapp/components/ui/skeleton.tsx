import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-shimmer rounded-2xl bg-gradient-to-r from-muted via-muted/60 to-muted", className)} {...props} />;
}
