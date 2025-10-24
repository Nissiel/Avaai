import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Analytics détaillés</h1>
        <p className="text-sm text-muted-foreground">
          Suivez le volume d'appels, le sentiment et les sujets clés en temps réel pour optimiser Ava.
        </p>
      </header>
      <AnalyticsDashboard />
    </section>
  );
}
