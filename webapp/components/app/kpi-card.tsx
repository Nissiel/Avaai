import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  delta?: {
    value: number;
    trend: "up" | "down" | "flat";
    label: string;
  };
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function KpiCard({ title, value, unit, delta, description, actionLabel, onAction, className }: KpiCardProps) {
  const formattedValue = typeof value === "number" ? formatNumber(value) : value;
  return (
    <Card className={cn("gap-4", className)}>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</CardTitle>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em]">{formattedValue}</span>
              {unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
            </div>
          </div>
          {delta ? (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                delta.trend === "up" && "bg-status-success/15 text-status-success",
                delta.trend === "down" && "bg-status-danger/15 text-status-danger",
                delta.trend === "flat" && "bg-muted text-muted-foreground",
              )}
            >
              <ArrowUpRight className={cn("h-3.5 w-3.5", delta.trend === "down" && "rotate-90")}
              />
              {delta.value}%
            </div>
          ) : null}
        </div>
        {description ? <CardDescription className="text-sm leading-relaxed">{description}</CardDescription> : null}
      </CardContent>
      {actionLabel ? (
        <CardFooter className="px-6 pb-6 pt-0">
          <Button variant="ghost" className="gap-2" onClick={onAction}>
            {actionLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
