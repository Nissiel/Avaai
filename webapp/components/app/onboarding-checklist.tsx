import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Onboarding checklist</CardTitle>
            <CardDescription>Finish the last steps to unlock all automations.</CardDescription>
          </div>
          <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600">
            {items.filter((item) => item.completed).length}/{items.length} done
          </span>
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <Checkbox checked={item.completed} aria-label={item.title} className="mt-1" disabled />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-semibold">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
              {item.actionLabel ? (
                <Button size="sm" variant="outline" className="self-center">
                  {item.actionLabel}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
