import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { demoIntegrations } from "@/lib/mock-data";

const statusLabel: Record<string, string> = {
  connected: "Connected",
  action_required: "Action required",
  not_connected: "Not connected",
};

const statusStyle: Record<string, string> = {
  connected: "bg-status-success/15 text-status-success",
  action_required: "bg-status-warning/15 text-status-warning",
  not_connected: "bg-muted text-muted-foreground",
};

export function IntegrationGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {demoIntegrations.map((integration) => (
        <Card key={integration.id} className="border-border/60">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </div>
              <Badge className={statusStyle[integration.status]}>{statusLabel[integration.status]}</Badge>
            </div>
            <div className="flex gap-3">
              <Button size="sm">{integration.status === "connected" ? "Manage" : "Connect"}</Button>
              <Button size="sm" variant="ghost">
                Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
