import { IntegrationGrid } from "@/components/app/integration-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Integrations</h1>
          <p className="text-sm text-muted-foreground">Connect voice, calendar, inbox, and CRM systems. Ava handles OAuth and webhooks.</p>
        </div>
        <Button variant="outline">Integration docs</Button>
      </header>
      <IntegrationGrid />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Need custom logic? Expose signed webhooks to your platform or trigger workflows via Zapier.
        </CardContent>
      </Card>
    </div>
  );
}
