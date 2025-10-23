import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { demoAuditExports, demoSecurityToggles } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export function SecuritySettings() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <CardTitle className="text-lg">Security policy</CardTitle>
            <CardDescription>Adjust controls for access, motion, and data protection.</CardDescription>
          </div>
          <ul className="space-y-3">
            {demoSecurityToggles.map((toggle) => (
              <li key={toggle.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{toggle.title}</p>
                  <p className="text-xs text-muted-foreground">{toggle.description}</p>
                </div>
                <Switch defaultChecked={toggle.enabled} />
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            Require SSO? Configure SAML/OIDC under identity providers.
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Audit exports</CardTitle>
              <CardDescription>Download or schedule GDPR exports.</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              Schedule export
            </Button>
          </div>
          <ul className="space-y-3">
            {demoAuditExports.map((exportJob) => (
              <li key={exportJob.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{exportJob.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(exportJob.createdAt, "en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{exportJob.size} · {exportJob.status}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
