import { ScheduleBoard } from "@/components/app/schedule-board";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Availability</h1>
          <p className="text-sm text-muted-foreground">Real-time sync with Google and Outlook. Ava books into trusted slots only.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Open calendar</Button>
          <Button>Adjust working hours</Button>
        </div>
      </header>
      <ScheduleBoard />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Tip: share Ava's booking links per playbook. Slots respect meeting buffers, timezone detection, and CRM ownership rules.
        </CardContent>
      </Card>
    </div>
  );
}
