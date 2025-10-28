import { NextResponse } from "next/server";

import { fetchAnalyticsHeatmap } from "@/services/analytics-service";

// Force dynamic rendering - this route fetches real-time data
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const heatmap = await fetchAnalyticsHeatmap();
    return NextResponse.json({ success: true, heatmap });
  } catch (error) {
    console.error("Analytics heatmap fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics heatmap" },
      { status: 502 },
    );
  }
}
