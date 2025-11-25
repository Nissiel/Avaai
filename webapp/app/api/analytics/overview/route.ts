import { NextRequest, NextResponse } from "next/server";

import { fetchAnalyticsOverview } from "@/services/analytics-service";
import { getRequestAccessToken } from "@/app/api/_utils/auth";
import { isDevBypassEnabled, createMockAnalyticsOverview } from "@/app/api/auth/_lib/dev-bypass";

// Force dynamic rendering - this route fetches real-time data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 🔓 DEV BYPASS: Return mock analytics without hitting backend
  if (isDevBypassEnabled()) {
    return createMockAnalyticsOverview();
  }

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
