import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoInbox } from "@/lib/mock-data";

const statusBadge: Record<string, string> = {
  open: "bg-status-info/15 text-status-info",
  in_progress: "bg-status-warning/15 text-status-warning",
  completed: "bg-status-success/15 text-status-success",
};

export function UnifiedInbox() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Unified inbox</CardTitle>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <ul className="space-y-3">
          {demoInbox.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <Badge variant="outline" className="capitalize">
                {item.type}
              </Badge>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <Badge className={statusBadge[item.status] ?? ""}>{item.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.assignee}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
