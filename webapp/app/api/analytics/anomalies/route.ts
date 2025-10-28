import { NextResponse } from "next/server";

import { fetchAnalyticsAnomalies } from "@/services/analytics-service";

// Force dynamic rendering - this route fetches real-time data
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const anomalies = await fetchAnalyticsAnomalies();
    return NextResponse.json({ success: true, anomalies });
  } catch (error) {
    console.error("Analytics anomalies fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics anomalies" },
      { status: 502 },
    );
  }
}
