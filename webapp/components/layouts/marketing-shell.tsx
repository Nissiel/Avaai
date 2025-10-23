"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const localeHook = useLocale();
  const locale: Locale = isLocale(localeHook) ? localeHook : fallbackLocale;
  const docsHref = `/${locale}/docs` as const;
  const privacyHref = `/${locale}/privacy` as const;
  const termsHref = `/${locale}/terms` as const;
  const securityHref = `/${locale}/security` as const;
  const authHref = `/${locale}/auth` as const;
  const onboardingHref = `/${locale}/onboarding` as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-screen-xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="text-lg font-semibold tracking-[-0.04em] text-foreground">
            Ava.ai
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <Link href={`/${locale}#features`}>{translate(locale, "marketing.features", "Features")}</Link>
            <Link href={`/${locale}#pricing`}>{translate(locale, "marketing.pricing", "Pricing")}</Link>
            <Link href={`/${locale}#faq`}>{translate(locale, "marketing.faq", "FAQ")}</Link>
            <Link href={docsHref as any}>{translate(locale, "marketing.docs", "Docs")}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href={authHref as any}>{translate(locale, "marketing.signIn", "Sign in")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={onboardingHref as any}>{translate(locale, "common.cta.primary", "Create my Ava")}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Ava.ai</span>
          <div className="flex gap-4">
            <Link href={privacyHref as any}>{translate(locale, "marketing.privacy", "Privacy")}</Link>
            <Link href={termsHref as any}>{translate(locale, "marketing.terms", "Terms")}</Link>
            <Link href={securityHref as any}>{translate(locale, "marketing.security", "Security")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
