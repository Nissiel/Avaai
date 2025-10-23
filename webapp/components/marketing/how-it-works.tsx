import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

interface HowItWorksProps {
  locale: string;
}

export function HowItWorks({ locale: localeParam }: HowItWorksProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const steps = [
    {
      title: translate(locale, "marketing.how.steps.1.title", "Model your assistant"),
      description: translate(
        locale,
        "marketing.how.steps.1.description",
        "Choose persona, tone, guardrails and channels. Auto-generated prompts keep Ava on rail.",
      ),
      meta: translate(locale, "marketing.how.steps.1.meta", "5 min"),
    },
    {
      title: translate(locale, "marketing.how.steps.2.title", "Wire integrations"),
      description: translate(
        locale,
        "marketing.how.steps.2.description",
        "Connect Twilio, calendars, inboxes and CRMs with guided OAuth flows and sandbox mocks.",
      ),
      meta: translate(locale, "marketing.how.steps.2.meta", "10 min"),
    },
    {
      title: translate(locale, "marketing.how.steps.3.title", "Launch & monitor"),
      description: translate(
        locale,
        "marketing.how.steps.3.description",
        "Test calls, share command palette shortcuts, and export webhooks to bring Ava into your ops.",
      ),
      meta: translate(locale, "marketing.how.steps.3.meta", "Continuous"),
    },
  ];

  return (
    <section className="bg-gradient-to-br from-brand-500/5 via-background to-background" id="how-it-works">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-16 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {translate(locale, "marketing.how.title", "From hello to full rollout in days, not quarters")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {translate(locale, "marketing.how.subtitle", "A guided system with guardrails and mocks so you can iterate safely before going live.")}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-subtle">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold uppercase tracking-[0.24em]">{(index + 1).toString().padStart(2, "0")}</span>
                <span>{step.meta}</span>
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
