import Link from "next/link";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

interface CtaProps {
  locale: string;
}

export function FinalCta({ locale: localeParam }: CtaProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const expertHref = `/${locale}/talk-to-expert` as const;
  return (
    <section className="bg-gradient-to-br from-brand-500/20 via-brand-500/10 to-background py-20">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center gap-8 px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {translate(locale, "marketing.cta.title", "Ready to launch Ava for your organization?")}
        </h2>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {translate(
            locale,
            "marketing.cta.subtitle",
            "Create your workspace, invite the team, and start handling calls with Ava in under an hour.",
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="ghost" size="lg">
            <Link href={expertHref as any}>
              {translate(locale, "marketing.cta.secondary", "Talk to an expert")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
