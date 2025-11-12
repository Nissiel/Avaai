import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/app/api/_lib/backend-client";

const BACKEND_PATH = "/api/v1/assistants";

/**
 * 🔥 DIVINE FIX: Proxy route for /api/v1/assistants
 * 
 * This route was being called directly from frontend but didn't exist.
 * Now properly proxies to backend API.
 */

export async function GET(request: NextRequest) {
  try {
    const upstream = await proxyBackend(request, {
      path: BACKEND_PATH,
      method: "GET",
    });

    const data = await upstream.json().catch(() => ({ assistants: [], configured: false }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("[assistants proxy] Error:", error);
    return NextResponse.json(
      { 
        assistants: [], 
        configured: false,
        error: "Failed to fetch assistants" 
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const upstream = await proxyBackend(request, {
      path: BACKEND_PATH,
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const data = await upstream.json().catch(() => ({ error: "Invalid response" }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("[assistants proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
