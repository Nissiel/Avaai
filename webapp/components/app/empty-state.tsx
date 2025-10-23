import { Button, type ButtonProps } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: ButtonProps & { label: string };
  secondaryAction?: ButtonProps & { label: string };
  className?: string;
}

export function EmptyState({ title, description, icon, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <Card className={cn("items-center justify-center text-center", className)}>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-brand-600">
          {icon}
        </span>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription className="max-w-md text-base leading-relaxed text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action ? <Button {...action}>{action.label}</Button> : null}
          {secondaryAction ? (
            <Button variant="ghost" {...secondaryAction}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
