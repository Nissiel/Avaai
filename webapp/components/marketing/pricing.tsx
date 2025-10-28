import Link from "next/link";
import { PLAN_TIERS } from "@/lib/constants";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PricingProps {
  locale: string;
}

export function Pricing({ locale: localeParam }: PricingProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;

  return (
    <section id="pricing" className="border-b border-border/50 bg-background">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-12 px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {translate(locale, "marketing.pricing.title", "Plans that scale with your team")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {translate(locale, "marketing.pricing.subtitle", "Start free, upgrade when you need more minutes, analytics, or compliance.")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_TIERS.map((plan) => (
            <div
              key={plan.id}
              className="relative flex h-full flex-col gap-6 rounded-3xl border border-border/70 bg-background p-8 shadow-subtle"
            >
              {plan.id === "business" ? (
                <div className="absolute right-6 top-6 rounded-full border border-gold-500/40 bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
                  {translate(locale, "marketing.pricing.best", "Most advanced")}
                </div>
              ) : null}
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-[-0.03em]">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div>
                {plan.price === 0 ? (
                  <p className="text-3xl font-semibold">{translate(locale, "marketing.pricing.free", "Free")}</p>
                ) : (
                  <p className="text-3xl font-semibold">
                    {formatCurrency(plan.price, locale, plan.currency)}
                    <span className="text-base font-medium text-muted-foreground">/{translate(locale, "marketing.pricing.month", "month")}</span>
                  </p>
                )}
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-auto">
                <Link href={`/${locale}/signup`}>
                  {plan.id === "free"
                    ? translate(locale, "marketing.pricing.cta.getStarted", "Start for free")
                    : translate(locale, "marketing.pricing.cta.bookDemo", "Book a demo")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
