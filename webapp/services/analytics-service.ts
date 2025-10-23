import "server-only";

import type {
  AnalyticsAnomaly,
  AnalyticsHeatmapCell,
  AnalyticsTimeseriesPoint,
  AnalyticsTopic,
  DashboardAnalytics,
} from "@/lib/dto";
import { backendConfig } from "@/services/backend-service";

const ANALYTICS_BASE = `${backendConfig.baseUrl}/api/v1/analytics`;

export async function fetchAnalyticsOverview(): Promise<DashboardAnalytics> {
  const response = await fetch(`${ANALYTICS_BASE}/overview`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load analytics overview (status: ${response.status})`);
  }

  return response.json();
}

async function fetchAnalyticsEndpoint<T>(path: string): Promise<T> {
  const response = await fetch(`${ANALYTICS_BASE}/${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load analytics ${path} (status: ${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAnalyticsTimeseries(): Promise<AnalyticsTimeseriesPoint[]> {
  const payload = await fetchAnalyticsEndpoint<{ series: AnalyticsTimeseriesPoint[] }>("timeseries");
  return payload.series ?? [];
}

export async function fetchAnalyticsTopics(): Promise<AnalyticsTopic[]> {
  const payload = await fetchAnalyticsEndpoint<{ topics: AnalyticsTopic[] }>("topics");
  return payload.topics ?? [];
}

export async function fetchAnalyticsAnomalies(): Promise<AnalyticsAnomaly[]> {
  const payload = await fetchAnalyticsEndpoint<{ anomalies: AnalyticsAnomaly[] }>("anomalies");
  return payload.anomalies ?? [];
}

export async function fetchAnalyticsHeatmap(): Promise<AnalyticsHeatmapCell[]> {
  const payload = await fetchAnalyticsEndpoint<{ heatmap: AnalyticsHeatmapCell[] }>("heatmap");
  return payload.heatmap ?? [];
}
