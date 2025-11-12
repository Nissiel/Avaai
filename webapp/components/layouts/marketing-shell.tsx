"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";
import { AvaLogoWordmark } from "@/components/brand/logo";

const external = {
  community: "https://discord.gg",
  status: "https://status.vapi.ai",
  docs: "https://docs.vapi.ai",
};

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const localeHook = useLocale();
  const locale: Locale = isLocale(localeHook) ? localeHook : fallbackLocale;

  const routes: Record<string, string> = {
    home: `/${locale}`,
    docs: `/${locale}/docs`,
    privacy: `/${locale}/privacy`,
    terms: `/${locale}/terms`,
    security: `/${locale}/security`,
    auth: `/${locale}/auth`,
    features: `/${locale}#features`,
    pricing: `/${locale}#pricing`,
    faq: `/${locale}#faq`,
  };

  const quickLinks: { label: string; href: string }[] = [
    { label: translate(locale, "marketing.features", "Features"), href: routes.features },
    { label: translate(locale, "marketing.pricing", "Pricing"), href: routes.pricing },
    { label: translate(locale, "marketing.faq", "FAQ"), href: routes.faq },
  ];

  const footerColumns: {
    title: string;
    links: { label: string; href: string; external?: boolean }[];
  }[] = [
      {
        title: translate(locale, "marketing.product", "Product"),
        links: [
          { label: translate(locale, "marketing.features", "Features"), href: routes.features },
          { label: translate(locale, "marketing.pricing", "Pricing"), href: routes.pricing },
        ],
      },
      {
        title: translate(locale, "marketing.resources", "Resources"),
        links: [
          { label: translate(locale, "marketing.docs", "Docs"), href: routes.docs },
          { label: "API Vapi", href: external.docs, external: true },
          { label: translate(locale, "marketing.faq", "FAQ"), href: routes.faq },
        ],
      },
      {
        title: translate(locale, "marketing.support", "Support"),
        links: [
          { label: "support@ava.ai", href: "mailto:support@ava.ai" },
          { label: "Community", href: external.community, external: true },
          { label: "Status", href: external.status, external: true },
        ],
      },
    ];

  const hasRenderableChildren = hasMeaningfulChildren(children);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER FIXE MODERNE */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-6">
          {/* Logo */}
          <Link href={routes.home as any} className="transition-opacity hover:opacity-80">
            <AvaLogoWordmark subtitle="Studio" />
          </Link>

          {/* Navigation centrale */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href={routes.features as any}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {translate(locale, "marketing.features", "Features")}
            </Link>
            <Link
              href={routes.pricing as any}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {translate(locale, "marketing.pricing", "Pricing")}
            </Link>
            <Link
              href={routes.faq as any}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16" />

      <main className="flex flex-1 flex-col">{hasRenderableChildren ? (
        children
      ) : (
        <DefaultMarketingFallback
          locale={locale}
          translate={(key, fallbackText) => translate(locale, key, fallbackText)}
          routes={routes}
        />
      )}
      </main>

      <footer className="border-t border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-12 px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.04em] text-foreground">Ava.ai Studio</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {translate(
                    locale,
                    "marketing.taglineFooter",
                    "The AI receptionist that captures every opportunity 24/7.",
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href as any}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-5 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary/60" aria-hidden />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-3">
                <h4 className="font-semibold text-foreground">{column.title}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {column.links.map((link) => {
                    const href = link.href;
                    return (
                      <li key={link.label}>
                        <Link
                          href={href as any}
                          className="transition-colors hover:text-primary"
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noreferrer" : undefined}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6 border-t border-border/50 pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Ava.ai</p>
            <div className="flex flex-wrap gap-5">
              <Link href={routes.privacy as any}>{translate(locale, "marketing.privacy", "Privacy")}</Link>
              <Link href={routes.terms as any}>{translate(locale, "marketing.terms", "Terms")}</Link>
              <Link href={routes.security as any}>{translate(locale, "marketing.security", "Security")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface DefaultMarketingFallbackProps {
  locale: Locale;
  translate: (key: string, fallbackText: string) => string;
  routes: Record<string, string>;
}

function hasMeaningfulChildren(children: React.ReactNode): boolean {
  const array = React.Children.toArray(children);
  for (const child of array) {
    if (child === null || child === undefined) {
      continue;
    }
    if (typeof child === "boolean") {
      continue;
    }
    if (typeof child === "string") {
      if (child.trim().length > 0) return true;
      continue;
    }
    if (React.isValidElement(child)) {
      if (child.type === React.Fragment) {
        if (hasMeaningfulChildren(child.props.children)) return true;
        continue;
      }
      return true;
    }
    return true;
  }
  return false;
}

function DefaultMarketingFallback({ translate, routes }: DefaultMarketingFallbackProps) {
  const stats = [
    {
      value: translate("marketing.fallback.stats.calls.value", "99.9%"),
      label: translate("marketing.fallback.stats.calls.label", "Calls answered"),
    },
    {
      value: translate("marketing.fallback.stats.csat.value", "4.9/5"),
      label: translate("marketing.fallback.stats.csat.label", "Satisfaction score"),
    },
    {
      value: translate("marketing.fallback.stats.setup.value", "3 min"),
      label: translate("marketing.fallback.stats.setup.label", "Average setup"),
    },
  ];

  return (
    <section className="relative flex flex-1 justify-center overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,_rgba(99,102,241,0.12)_0%,_transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-12 px-6 pb-16 pt-12 text-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {translate("marketing.fallback.badge", "Ava Studio")}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {translate("marketing.fallback.title", "Votre assistante IA toujours disponible")}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {translate(
              "marketing.fallback.subtitle",
              "Créez, configurez et lancez une réceptionniste intelligente sans code. Ava décroche, qualifie et prend vos rendez-vous en toute autonomie.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href={routes.docs as any}>{translate("marketing.fallback.secondary", "Découvrir la demo")}</Link>
          </Button>
        </div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-background/60 px-6 py-5 text-left shadow-sm backdrop-blur"
            >
              <p className="text-2xl font-semibold text-foreground md:text-3xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
