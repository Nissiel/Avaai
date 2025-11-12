import type {
  AnalyticsAnomaly,
  AnalyticsHeatmapCell,
  AnalyticsTimeseriesPoint,
  AnalyticsTopic,
  DashboardAnalytics,
} from "@/lib/dto";
import { serverFetchBackend } from "@/lib/http/server-client";

const ANALYTICS_BASE = "/api/v1/analytics";
const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

/**
 * Returns empty analytics data for graceful degradation
 */
function getEmptyAnalytics(): DashboardAnalytics {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  return {
    overview: {
      totalCalls: 0,
      activeNow: 0,
      avgDurationSeconds: 0,
      satisfaction: 0,
      totalCost: 0,
      period: {
        start: sevenDaysAgo.toISOString(),
        end: now.toISOString(),
      },
    },
    calls: [],
    topics: [],
  };
}

export async function fetchAnalyticsOverview(token: string): Promise<DashboardAnalytics> {
  try {
    const response = await serverFetchBackend(`${ANALYTICS_BASE}/overview`, {
      method: "GET",
      headers: JSON_HEADERS,
      authToken: token,
    });

    if (!response.ok) {
      console.warn(`Analytics overview unavailable (status: ${response.status})`);
      return getEmptyAnalytics();
    }

    return response.json();
  } catch (error) {
    console.warn("Analytics service unavailable:", error);
    return getEmptyAnalytics();
  }
}

async function fetchAnalyticsEndpoint<T>(path: string, fallback: T, token: string): Promise<T> {
  try {
    const response = await serverFetchBackend(`${ANALYTICS_BASE}/${path}`, {
      method: "GET",
      headers: JSON_HEADERS,
      authToken: token,
    });

    if (!response.ok) {
      console.warn(`Analytics ${path} unavailable (status: ${response.status})`);
      return fallback;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.warn(`Analytics ${path} failed:`, error);
    return fallback;
  }
}

export async function fetchAnalyticsTimeseries(token: string): Promise<AnalyticsTimeseriesPoint[]> {
  const payload = await fetchAnalyticsEndpoint<{ series: AnalyticsTimeseriesPoint[] }>(
    "timeseries",
    { series: [] },
    token,
  );
  return payload.series ?? [];
}

export async function fetchAnalyticsTopics(token: string): Promise<AnalyticsTopic[]> {
  const payload = await fetchAnalyticsEndpoint<{ topics: AnalyticsTopic[] }>(
    "topics",
    { topics: [] },
    token,
  );
  return payload.topics ?? [];
}

export async function fetchAnalyticsAnomalies(token: string): Promise<AnalyticsAnomaly[]> {
  const payload = await fetchAnalyticsEndpoint<{ anomalies: AnalyticsAnomaly[] }>(
    "anomalies",
    { anomalies: [] },
    token,
  );
  return payload.anomalies ?? [];
}

export async function fetchAnalyticsHeatmap(token: string): Promise<AnalyticsHeatmapCell[]> {
  const payload = await fetchAnalyticsEndpoint<{ heatmap: AnalyticsHeatmapCell[] }>(
    "heatmap",
    { heatmap: [] },
    token,
  );
  return payload.heatmap ?? [];
}
