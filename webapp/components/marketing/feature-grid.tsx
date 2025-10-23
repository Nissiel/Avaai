import { BrainCircuit, CalendarRange, PhoneCall, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

interface FeatureGridProps {
  locale: string;
}

const icons = [BrainCircuit, PhoneCall, CalendarRange, Workflow, ShieldCheck, Sparkles];

export function FeatureGrid({ locale: localeParam }: FeatureGridProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const features = [
    {
      title: translate(locale, "marketing.features_slots.voice", "Voice, email & SMS in one inbox"),
      description: translate(
        locale,
        "marketing.features_slots.voice_desc",
        "Route every interaction to Ava with warm handover to humans when needed.",
      ),
    },
    {
      title: translate(locale, "marketing.features_slots.scheduler", "Calendar-native scheduling"),
      description: translate(
        locale,
        "marketing.features_slots.scheduler_desc",
        "Sync Google, Outlook and HubSpot calendars with dynamic availability windows.",
      ),
    },
    {
      title: translate(locale, "marketing.features_slots.playbooks", "Playbooks that adapt"),
      description: translate(
        locale,
        "marketing.features_slots.playbooks_desc",
        "Start from concierge, SDR or CS templates and tune tone, guardrails, and autonomy.",
      ),
    },
    {
      title: translate(locale, "marketing.features_slots.compliance", "Enterprise compliance"),
      description: translate(
        locale,
        "marketing.features_slots.compliance_desc",
        "Call recording controls, audit logging, signed webhooks, and GDPR-ready data tools.",
      ),
    },
    {
      title: translate(locale, "marketing.features_slots.insights", "Realtime insights"),
      description: translate(
        locale,
        "marketing.features_slots.insights_desc",
        "Dashboards for minute usage, contact intents, CSAT and conversion by campaign.",
      ),
    },
    {
      title: translate(locale, "marketing.features_slots.pipeline", "Plays well with your stack"),
      description: translate(
        locale,
        "marketing.features_slots.pipeline_desc",
        "Native integrations with Twilio, Slack, Notion, HubSpot, Zapier and signed webhooks.",
      ),
    },
  ];

  return (
    <section id="features" className="border-b border-border/50 bg-background">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-12 px-4 py-20">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {translate(locale, "marketing.features.title", "Everything you need to pilot Ava")}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {translate(
              locale,
              "marketing.features.subtitle",
              "Design the persona, plug integrations, then monitor calls and outcomes in real time.",
            )}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div key={feature.title} className="relative flex flex-col gap-4 rounded-3xl border border-border/70 bg-background p-6 shadow-subtle">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
