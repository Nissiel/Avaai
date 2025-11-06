import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeader(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header;
  }
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) {
    return `Bearer ${cookieToken}`;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();

  try {
    const response = await fetch(`${API_URL}/api/v1/studio/sync-vapi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: body && body.trim() ? body : "{}",
    });

    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = raw ? { detail: raw.slice(0, 512) } : {};
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Studio sync proxy error:", error);
    return NextResponse.json(
      { detail: "Failed to reach studio sync service" },
      { status: 502 },
    );
  }
}
