import { NextResponse } from "next/server";

import { fetchAnalyticsTopics } from "@/services/analytics-service";

export async function GET() {
  try {
    const topics = await fetchAnalyticsTopics();
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    console.error("Analytics topics fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics topics" },
      { status: 502 },
    );
  }
}
