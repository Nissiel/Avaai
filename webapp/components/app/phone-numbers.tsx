import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoNumbers } from "@/lib/mock-data";

const statusTone: Record<string, string> = {
  active: "bg-status-success/15 text-status-success",
  pending: "bg-status-warning/15 text-status-warning",
  disabled: "bg-status-danger/15 text-status-danger",
};

export function PhoneNumbers() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Numbers & routing</CardTitle>
            <CardDescription>Provisioned Twilio numbers with routing profiles.</CardDescription>
          </div>
          <Button size="sm">Purchase number</Button>
        </div>
        <ul className="space-y-3">
          {demoNumbers.map((number) => (
            <li key={number.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{number.formatted}</p>
                  <p className="text-xs text-muted-foreground">Routing: {number.routingProfile}</p>
                </div>
                <Badge className={statusTone[number.status]}>{number.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
