import { KpiCard } from "@/components/app/kpi-card";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { ActivityTimeline } from "@/components/app/timeline";
import { UnifiedInbox } from "@/components/app/inbox-list";
import { Card, CardContent } from "@/components/ui/card";
import { demoMetrics } from "@/lib/mock-data";

export default function HomePage() {
  const checklist = [
    {
      id: "voice",
      title: "Provision voice number",
      description: "Purchase your Twilio number or attach existing SIP trunk.",
      completed: true,
    },
    {
      id: "calendars",
      title: "Connect calendars",
      description: "Sync Google & Outlook for true availability.",
      completed: true,
    },
    {
      id: "playbook",
      title: "Publish Ava playbook",
      description: "Finalize tone, guardrails, and fallback escalations.",
      completed: false,
      actionLabel: "Open Ava Studio",
    },
    {
      id: "analytics",
      title: "Enable analytics",
      description: "Hook PostHog and Sentry to capture insights.",
      completed: false,
      actionLabel: "Configure",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="CSAT"
          value={demoMetrics.csat}
          unit="/100"
          delta={{ value: 12, trend: "up", label: "vs last week" }}
          description="Average caller satisfaction over the last 7 days."
          actionLabel="Open feedback"
        />
        <KpiCard
          title="Calls answered"
          value={demoMetrics.callsAnswered}
          delta={{ value: 8, trend: "up", label: "week" }}
          description="Answered by Ava with human handovers."
          actionLabel="View calls"
        />
        <KpiCard
          title="Meetings booked"
          value={demoMetrics.meetingsBooked}
          delta={{ value: 5, trend: "up", label: "week" }}
          description="Confirmed in connected calendars."
          actionLabel="Open schedules"
        />
        <KpiCard
          title="Missed calls"
          value={demoMetrics.callsMissed}
          delta={{ value: 3, trend: "down", label: "week" }}
          description="Outside business hours or fallback triggered."
          actionLabel="Review routing"
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <OnboardingChecklist items={checklist} />
          <UnifiedInbox />
        </div>
        <ActivityTimeline />
      </section>

      <section>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            <p>
              Use the command palette (<kbd className="rounded border border-border px-2">⌘K</kbd>) to jump to Ava Studio, trigger
              test calls, or invite teammates. Ava is currently running in <strong>Pro</strong> mode with compliance guardrails
              enabled.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
