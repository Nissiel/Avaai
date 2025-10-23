import { NextResponse } from "next/server";

import { fetchAnalyticsTimeseries } from "@/services/analytics-service";

export async function GET() {
  try {
    const series = await fetchAnalyticsTimeseries();
    return NextResponse.json({ success: true, series });
  } catch (error) {
    console.error("Analytics timeseries fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics timeseries" },
      { status: 502 },
    );
  }
}
