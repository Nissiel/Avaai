"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Waves } from "lucide-react";

import {
  getAnalyticsAnomalies,
  getAnalyticsHeatmap,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsTopics,
} from "@/lib/api/analytics";
import type {
  AnalyticsAnomaly,
  AnalyticsHeatmapCell,
  AnalyticsTimeseriesPoint,
  AnalyticsTopic,
  CallSummary,
} from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCallsStore } from "@/stores/calls-store";

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateLabel(value: string) {
  try {
    return format(parseISO(value), "dd MMM", { locale: fr });
  } catch (error) {
    return value;
  }
}

function KpiGrid({
  totalCalls,
  activeNow,
  avgDuration,
  satisfaction,
  totalCost,
}: {
  totalCalls: number;
  activeNow: number;
  avgDuration: string;
  satisfaction: number;
  totalCost?: number;
}) {
  const kpis = [
    { label: "Appels", value: totalCalls, footer: "7 derniers jours" },
    { label: "Actifs", value: activeNow, footer: "en direct" },
    { label: "Durée moyenne", value: avgDuration, footer: "min par appel" },
    { label: "Satisfaction", value: `${Math.round(satisfaction * 100)}%`, footer: "score moyen" },
    { label: "Coûts", value: totalCost ? `${totalCost.toFixed(2)} €` : "—", footer: "période" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <GlassCard key={kpi.label} variant="none" className="space-y-2 bg-muted/20">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{kpi.label}</p>
          <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
          <p className="text-xs text-muted-foreground">{kpi.footer}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function TimeseriesChart({ data }: { data: AnalyticsTimeseriesPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible. Les appels récents apparaîtront ici.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ left: 0, right: 12 }}>
        <defs>
          <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" fontSize={12} />
        <YAxis yAxisId="calls" stroke="#94a3b8" fontSize={12} width={48} />
        <YAxis yAxisId="sentiment" orientation="right" stroke="#cbd5f5" fontSize={12} width={48} domain={[0, 1]} />
        <Tooltip
          contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.4)" }}
          formatter={(value: number, name: string) => {
            if (name === "avgSentiment") {
              return [`${(value * 100).toFixed(1)}%`, "Sentiment"];
            }
            if (name === "avgDuration") {
              return [`${value.toFixed(2)} min`, "Durée" ];
            }
            if (name === "failedRate") {
              return [`${(value * 100).toFixed(1)}%`, "Échecs"];
            }
            return [value, "Appels"];
          }}
          labelFormatter={(value) => formatDateLabel(String(value))}
        />
        <Area yAxisId="calls" type="monotone" dataKey="totalCalls" stroke="#2563eb" fill="url(#callsGradient)" strokeWidth={2} />
        <Line yAxisId="sentiment" type="monotone" dataKey="avgSentiment" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TopicsCloud({ topics }: { topics: AnalyticsTopic[] }) {
  if (!topics.length) {
    return <p className="text-sm text-muted-foreground">Les sujets remontés dans les transcriptions apparaîtront ici.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {topics.map((topic) => (
        <span
          key={topic.label}
          className="rounded-full bg-brand-500/10 px-3 py-1 text-brand-600"
          style={{ fontSize: `${12 + topic.weight * 14}px` }}
        >
          {topic.label}
        </span>
      ))}
    </div>
  );
}

function AnomalyList({ anomalies }: { anomalies: AnalyticsAnomaly[] }) {
  if (!anomalies.length) {
    return <p className="text-sm text-muted-foreground">Aucune anomalie détectée récemment.</p>;
  }

  return (
    <div className="space-y-3">
      {anomalies.map((anomaly) => (
        <div key={`${anomaly.callId}-${anomaly.occurredAt}`} className="flex items-start gap-3 rounded-2xl border border-border/50 p-3">
          <div className={"rounded-full bg-destructive/10 p-1 text-destructive"}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{anomaly.message}</span>
              <Badge variant={anomaly.severity === "critical" ? "danger" : "warning"}>{anomaly.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Appel #{anomaly.callId} • {formatDistanceToNow(new Date(anomaly.occurredAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ cells }: { cells: AnalyticsHeatmapCell[] }) {
  if (!cells.length) {
    return <p className="text-sm text-muted-foreground">La carte de chaleur apparaîtra après quelques appels.</p>;
  }

  const map = new Map<string, AnalyticsHeatmapCell>();
  cells.forEach((cell) => {
    map.set(`${cell.weekday}-${cell.hour}`, cell);
  });

  return (
    <div className="grid gap-1">
      {dayLabels.map((label, dayIndex) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-10 text-xs text-muted-foreground">{label}</span>
          <div className="grid flex-1 grid-cols-12 gap-1">
            {Array.from({ length: 12 }).map((_, block) => {
              const hour = block * 2;
              const cell = map.get(`${dayIndex}-${hour}`);
              const intensity = cell ? Math.min(1, cell.intensity + 0.05) : 0;
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="h-6 rounded-lg"
                  title={cell ? `${cell.count} appels entre ${hour}h et ${hour + 1}h` : `Aucun appel entre ${hour}h et ${hour + 1}h`}
                  style={{
                    background: intensity
                      ? `linear-gradient(135deg, rgba(59,130,246,${0.15 + intensity * 0.6}), rgba(14,165,233,${0.1 + intensity * 0.4}))`
                      : "rgba(226,232,240,0.35)",
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentCalls({ calls }: { calls: CallSummary[] }) {
  if (!calls.length) {
    return <p className="text-sm text-muted-foreground">Encore aucun appel enregistré. Votre premier appel apparaîtra ici.</p>;
  }

  return (
    <div className="grid gap-3">
      {calls.slice(0, 6).map((call) => (
        <GlassCard key={call.id} className="bg-muted/10" variant="none">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Appel #{call.id}</p>
              <p className="text-xs text-muted-foreground">
                {call.startedAt
                  ? `${formatDistanceToNow(new Date(call.startedAt), { addSuffix: true, locale: fr })} • ${call.status}`
                  : call.status}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{call.durationSeconds ? `${Math.round(call.durationSeconds / 60)} min` : "—"}</span>
              <span>{call.cost ? `${call.cost.toFixed(2)} €` : "—"}</span>
              {call.sentiment != null ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Waves className="h-3 w-3" />
                  {(call.sentiment * 100).toFixed(0)}%
                </span>
              ) : null}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function AnalyticsDashboard() {
  const setCalls = useCallsStore((state) => state.setCalls);

  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: getAnalyticsOverview,
    staleTime: 60_000,
  });
  const timeseriesQuery = useQuery({
    queryKey: ["analytics", "timeseries"],
    queryFn: getAnalyticsTimeseries,
    staleTime: 60_000,
  });
  const topicsQuery = useQuery({
    queryKey: ["analytics", "topics"],
    queryFn: getAnalyticsTopics,
    staleTime: 300_000,
  });
  const anomaliesQuery = useQuery({
    queryKey: ["analytics", "anomalies"],
    queryFn: getAnalyticsAnomalies,
    staleTime: 60_000,
  });
  const heatmapQuery = useQuery({
    queryKey: ["analytics", "heatmap"],
    queryFn: getAnalyticsHeatmap,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (overviewQuery.data?.calls) {
      setCalls(overviewQuery.data.calls);
    }
  }, [overviewQuery.data?.calls, setCalls]);

  const overview = overviewQuery.data?.overview;
  const timeseries = timeseriesQuery.data ?? [];
  const topics = useMemo(() => overviewQuery.data?.topics ?? topicsQuery.data ?? [], [overviewQuery.data?.topics, topicsQuery.data]);
  const anomalies = anomaliesQuery.data ?? [];
  const heatmap = heatmapQuery.data ?? [];
  const calls = overviewQuery.data?.calls ?? [];

  const loadingOverview = overviewQuery.isLoading;
  const loadingTimeseries = timeseriesQuery.isLoading;
  const loadingTopics = topicsQuery.isLoading && !overviewQuery.data?.topics;
  const loadingAnomalies = anomaliesQuery.isLoading;
  const loadingHeatmap = heatmapQuery.isLoading;

  return (
    <div className="space-y-8">
      {loadingOverview || !overview ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <KpiGrid
          totalCalls={overview.totalCalls}
          activeNow={overview.activeNow}
          avgDuration={overview.avgDuration}
          satisfaction={overview.satisfaction}
          totalCost={overview.totalCost}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="space-y-4" variant="none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Volume & sentiment</h2>
            {loadingTimeseries ? <Skeleton className="h-4 w-24" /> : null}
          </div>
          {loadingTimeseries ? <Skeleton className="h-72 w-full rounded-3xl" /> : <TimeseriesChart data={timeseries} />}
        </GlassCard>

        <GlassCard className="space-y-4" variant="none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sujets qui reviennent</h2>
            {loadingTopics ? <Skeleton className="h-4 w-16" /> : null}
          </div>
          {loadingTopics ? <Skeleton className="h-32 w-full rounded-3xl" /> : <TopicsCloud topics={topics} />}
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="space-y-4" variant="none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Carte de chaleur</h2>
            {loadingHeatmap ? <Skeleton className="h-4 w-16" /> : null}
          </div>
          {loadingHeatmap ? <Skeleton className="h-48 w-full rounded-3xl" /> : <Heatmap cells={heatmap} />}
        </GlassCard>

        <GlassCard className="space-y-4" variant="none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Anomalies</h2>
            {loadingAnomalies ? <Skeleton className="h-4 w-16" /> : null}
          </div>
          {loadingAnomalies ? <Skeleton className="h-32 w-full rounded-3xl" /> : <AnomalyList anomalies={anomalies} />}
        </GlassCard>
      </div>

      <GlassCard className="space-y-4" variant="none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Appels récents</h2>
          {overviewQuery.isLoading ? <Skeleton className="h-4 w-20" /> : null}
        </div>
        {overviewQuery.isLoading ? <Skeleton className="h-48 w-full rounded-3xl" /> : <RecentCalls calls={calls} />}
      </GlassCard>
    </div>
  );
}
