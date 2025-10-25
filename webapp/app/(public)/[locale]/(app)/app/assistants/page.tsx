import Link from "next/link";
import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";

import { FuturisticButton } from "@/components/ui/futuristic-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantsPage() {
  const locale = useLocale();
  const t = useTranslations("assistantsPage");
  const onboardingHref = `/${locale}/onboarding`.replace(/\/{2,}/g, "/");

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href={onboardingHref as Route}>
          <FuturisticButton size="md" glow>
            {t("cta")}
          </FuturisticButton>
        </Link>
      </header>
      <GlassCard className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("list.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("list.description")}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <GlassCard key={item} className="flex h-40 flex-col justify-between bg-muted/20" variant="none">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-9 w-full" />
            </GlassCard>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
      </GlassCard>
    </section>
  );
}
