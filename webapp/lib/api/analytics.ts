import type {
  AnalyticsAnomaly,
  AnalyticsHeatmapCell,
  AnalyticsTimeseriesPoint,
  AnalyticsTopic,
  DashboardAnalytics,
} from "@/lib/dto";

export async function getAnalyticsOverview(): Promise<DashboardAnalytics> {
  const response = await fetch("/api/analytics/overview", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load analytics overview (status: ${response.status})`);
  }

  const payload = (await response.json()) as DashboardAnalytics & { success?: boolean };
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
  const response = await fetch(`/api/analytics/${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load analytics ${path} (status: ${response.status})`);
  }

  return response.json() as Promise<T>;
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
