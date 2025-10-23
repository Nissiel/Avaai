import { BillingOverview } from "@/components/app/billing-overview";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Billing & usage</h1>
          <p className="text-sm text-muted-foreground">Stripe-powered billing with real-time usage and overage alerts.</p>
        </div>
      </header>
      <BillingOverview />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Configure alerts at 80% usage to notify finance and automatically switch to the Business plan when needed.
        </CardContent>
      </Card>
    </div>
  );
}
