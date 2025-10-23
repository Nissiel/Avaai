import { UnifiedInbox } from "@/components/app/inbox-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoInbox } from "@/lib/mock-data";

export default function InboxPage() {
  const openCount = demoInbox.filter((item) => item.status !== "completed").length;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Unified inbox</h1>
          <p className="text-sm text-muted-foreground">Calls, summaries, emails, and tasks surfaced for human review.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Filter</Button>
          <Button>Create task</Button>
        </div>
      </header>
      <UnifiedInbox />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {openCount} items require review. Assign owners directly from the call detail drawer or push to Asana via automations.
        </CardContent>
      </Card>
    </div>
  );
}
