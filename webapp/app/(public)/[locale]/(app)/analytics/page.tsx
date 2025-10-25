import { useTranslations } from "next-intl";

import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard";

export default function AnalyticsPage() {
  const t = useTranslations("analyticsPage");

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <AnalyticsDashboard />
    </section>
  );
}
