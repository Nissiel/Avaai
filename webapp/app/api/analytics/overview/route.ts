import { NextRequest, NextResponse } from "next/server";

import { fetchAnalyticsOverview } from "@/services/analytics-service";
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

    const analytics = await fetchAnalyticsOverview(token);
    return NextResponse.json({ success: true, ...analytics });
  } catch (error) {
    console.error("Analytics overview fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics overview" },
      { status: 502 },
    );
  }
}
