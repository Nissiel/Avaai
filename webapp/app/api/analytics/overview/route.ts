import { NextResponse } from "next/server";

import { fetchAnalyticsOverview } from "@/services/analytics-service";

export async function GET() {
  try {
    const analytics = await fetchAnalyticsOverview();
    return NextResponse.json({ success: true, ...analytics });
  } catch (error) {
    console.error("Analytics overview fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics overview" },
      { status: 502 },
    );
  }
}
