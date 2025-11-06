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

async function proxyRequest(request: NextRequest, init: RequestInit) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/twilio-settings`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        ...(init.headers || {}),
      },
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 204 });
    }

    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = raw ? { detail: raw.slice(0, 512) } : {};
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Twilio settings proxy error:", error);
    return NextResponse.json({ detail: "Twilio settings service unavailable" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, {
    method: "POST",
    body,
  });
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, { method: "DELETE" });
}
