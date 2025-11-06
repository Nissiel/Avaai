import { NextRequest, NextResponse } from "next/server";

import { fetchAnalyticsTimeseries } from "@/services/analytics-service";
import { getRequestAccessToken } from "@/app/api/_utils/auth";

// Force dynamic rendering - this route fetches real-time data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = getRequestAccessToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing authentication token" },
        { status: 401 },
      );
    }

    const series = await fetchAnalyticsTimeseries(token);
    return NextResponse.json({ success: true, series });
  } catch (error) {
    console.error("Analytics timeseries fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics timeseries" },
      { status: 502 },
    );
  }
}
