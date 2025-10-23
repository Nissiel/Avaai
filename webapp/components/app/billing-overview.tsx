import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { demoBillingPlans, demoBillingUsage } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function BillingOverview() {
  const usage = demoBillingUsage;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Usage this cycle</CardTitle>
              <CardDescription>Reset on {usage.nextInvoice}</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              View invoices
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageMeter
              label="Minutes"
              used={usage.minutesUsed}
              allocated={usage.minutesAllocated}
            />
            <UsageMeter label="SMS" used={usage.smsUsed} allocated={usage.smsAllocated} />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <strong>${usage.overages.toFixed(2)}</strong> in projected overages. Set alerts at 90% to stay ahead.
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-6">
          <CardTitle className="text-lg">Plans</CardTitle>
          <CardDescription>Switch plans or open the Stripe portal.</CardDescription>
          <div className="space-y-3">
            {demoBillingPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-left transition hover:border-brand-500"
              >
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.price === 0 ? "Free" : `${formatCurrency(plan.price, "en", plan.currency)}/mo`}
                </p>
              </button>
            ))}
          </div>
          <Button size="sm">Open Stripe portal</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageMeter({ label, used, allocated }: { label: string; used: number; allocated: number }) {
  const percent = Math.min(100, Math.round((used / allocated) * 100));
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background px-4 py-4">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{label}</span>
        <span>
          {used}/{allocated}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-brand-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
