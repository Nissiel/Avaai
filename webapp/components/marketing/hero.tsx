"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

interface HeroProps {
  locale: string;
}

export function Hero({ locale: localeParam }: HeroProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const demoHref = `/${locale}/demo` as const;
  const expertHref = `/${locale}/talk-to-expert` as const;
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-background to-background/40">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-12 px-4 py-20 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            {translate(locale, "marketing.badge", "Trusted by voice-first teams")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl"
          >
            {translate(locale, "marketing.heroTitle", "Your AI Secretary, truly useful on every channel")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            {translate(
              locale,
              "marketing.heroSubtitle",
              "Spin up Ava to answer calls, qualify leads, schedule and follow up in minutes with enterprise-grade guardrails.",
            )}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button asChild size="lg" className="gap-2">
              <Link href={demoHref as any}>{translate(locale, "common.cta.secondary", "See demo")}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={expertHref as any}>
                {translate(locale, "marketing.cta.secondary", "Talk to an expert")}
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
          >
            <span>{translate(locale, "marketing.heroStats.calls", "6.5M minutes answered without queueing")}</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" aria-hidden />
            <span>{translate(locale, "marketing.heroStats.csat", "+32 NPS vs. traditional call centers")}</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="relative flex flex-1 items-center justify-center"
        >
          <div className="relative flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {translate(locale, "marketing.preview.label", "Live call summary")}
                </p>
                <p className="text-lg font-semibold">Ava ↔︎ Client</p>
              </div>
              <div className="rounded-full border border-border px-3 py-1 text-xs font-medium text-brand-600">
                {translate(locale, "marketing.preview.realtime", "Realtime")}
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {translate(locale, "marketing.preview.callIntent", "Call intent")}
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {translate(locale, "marketing.preview.intentText", "Book a follow-up consultation for next Tuesday morning.")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {translate(locale, "marketing.preview.summary", "Next steps")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>{translate(locale, "marketing.preview.next1", "Send calendar invite for 09:30, Tuesday")}</li>
                  <li>{translate(locale, "marketing.preview.next2", "Share prep checklist via email")}</li>
                  <li>{translate(locale, "marketing.preview.next3", "Set SMS reminder 2 hours before")}</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                  <p>{translate(locale, "marketing.preview.minutes", "Minutes handled")}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">+128%</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                  <p>{translate(locale, "marketing.preview.csat", "CSAT")}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">9.4/10</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
