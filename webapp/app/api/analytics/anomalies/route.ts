import { NextRequest, NextResponse } from "next/server";

import { fetchAnalyticsAnomalies } from "@/services/analytics-service";
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

    const anomalies = await fetchAnalyticsAnomalies(token);
    return NextResponse.json({ success: true, anomalies });
  } catch (error) {
    console.error("Analytics anomalies fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics anomalies" },
      { status: 502 },
    );
  }
}
