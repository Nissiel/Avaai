import type { CallSummary } from "./calls";

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  activeNow: number;
  avgDurationSeconds: number;
  satisfaction: number;
  totalCost?: number;
  period: AnalyticsPeriod;
}

export interface DashboardAnalytics {
  overview: AnalyticsOverview;
  calls: CallSummary[];
  topics?: AnalyticsTopic[];
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  totalCalls: number;
  avgDuration: number;
  failedRate: number;
  avgSentiment: number | null;
}

export interface AnalyticsTopic {
  label: string;
  count: number;
  weight: number;
  callId?: string;
}

export interface AnalyticsAnomaly {
  callId: string;
  type: string;
  occurredAt: string;
  severity: "warning" | "critical" | string;
  message: string;
  assistantId?: string;
}

export interface AnalyticsHeatmapCell {
  weekday: number;
  hour: number;
  count: number;
  intensity: number;
}
