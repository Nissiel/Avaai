import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";
import type {
  AnalyticsAnomaly,
  AnalyticsHeatmapCell,
  AnalyticsTimeseriesPoint,
  AnalyticsTopic,
  DashboardAnalytics,
} from "@/lib/dto";

async function fetchInternalJson<T>(path: string, metricsLabel: string): Promise<T> {
  const response = await apiFetch(path, {
    baseUrl: "relative",
    timeoutMs: 10_000,
    metricsLabel,
  });

  const text = await response.text();
  const payload =
    safeJsonParse<T & { detail?: string; error?: string; success?: boolean }>(text, {
      fallback: {} as T,
      context: `analytics:${metricsLabel}`,
    }) ?? ({} as T);

  if (!response.ok) {
    const detail = (payload as { detail?: string; error?: string }).detail ?? (payload as { error?: string }).error;
    throw new Error(detail ?? `Failed request (${response.status})`);
  }

  return payload as T;
}

export async function getAnalyticsOverview(): Promise<DashboardAnalytics> {
  const payload = await fetchInternalJson<DashboardAnalytics & { success?: boolean; calls?: unknown[]; topics?: unknown[] }>(
    "/api/analytics/overview",
    "analytics.overview",
  );

  if (payload.success === false || !payload?.overview) {
    throw new Error("Analytics payload malformed");
  }

  return {
    overview: payload.overview,
    calls: payload.calls ?? [],
    topics: payload.topics ?? [],
  };
}

async function fetchClientEndpoint<T>(path: string): Promise<T> {
  return fetchInternalJson<T>(`/api/analytics/${path}`, `analytics.${path}`);
}

export async function getAnalyticsTimeseries(): Promise<AnalyticsTimeseriesPoint[]> {
  const payload = await fetchClientEndpoint<{ success?: boolean; series?: AnalyticsTimeseriesPoint[] }>("timeseries");
  if (payload.success === false) {
    throw new Error("Analytics timeseries payload malformed");
  }
  return payload.series ?? [];
}

export async function getAnalyticsTopics(): Promise<AnalyticsTopic[]> {
  const payload = await fetchClientEndpoint<{ success?: boolean; topics?: AnalyticsTopic[] }>("topics");
  if (payload.success === false) {
    throw new Error("Analytics topics payload malformed");
  }
  return payload.topics ?? [];
}

export async function getAnalyticsAnomalies(): Promise<AnalyticsAnomaly[]> {
  const payload = await fetchClientEndpoint<{ success?: boolean; anomalies?: AnalyticsAnomaly[] }>("anomalies");
  if (payload.success === false) {
    throw new Error("Analytics anomalies payload malformed");
  }
  return payload.anomalies ?? [];
}

export async function getAnalyticsHeatmap(): Promise<AnalyticsHeatmapCell[]> {
  const payload = await fetchClientEndpoint<{ success?: boolean; heatmap?: AnalyticsHeatmapCell[] }>("heatmap");
  if (payload.success === false) {
    throw new Error("Analytics heatmap payload malformed");
  }
  return payload.heatmap ?? [];
}
