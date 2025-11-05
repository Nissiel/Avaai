import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/studio/config - Get studio configuration
 * PATCH /api/studio/config - Update studio configuration
 *
 * 🎯 DIVINE: Proxy to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      console.error("❌ [GET /api/studio/config] No token provided");
      return NextResponse.json(
        { detail: "Unauthorized - No authentication token" },
        { status: 401 }
      );
    }

    console.log("🔄 [GET /api/studio/config] Fetching from backend:", {
      url: `${API_URL}/api/v1/studio/config`,
      hasToken: !!token,
    });

    const response = await fetch(`${API_URL}/api/v1/studio/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [GET /api/studio/config] Backend error:", {
        status: response.status,
        data,
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log("✅ [GET /api/studio/config] Success");
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [GET /api/studio/config] Exception:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { detail: `Internal server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      console.error("❌ [PATCH /api/studio/config] No token provided");
      return NextResponse.json(
        { detail: "Unauthorized - No authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    console.log("🔄 [PATCH /api/studio/config] Proxying to backend:", {
      url: `${API_URL}/api/v1/studio/config`,
      payload: body,
      hasToken: !!token,
    });

    const response = await fetch(`${API_URL}/api/v1/studio/config`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [PATCH /api/studio/config] Backend error:", {
        status: response.status,
        data,
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log("✅ [PATCH /api/studio/config] Success");
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [PATCH /api/studio/config] Exception:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { detail: `Internal server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
