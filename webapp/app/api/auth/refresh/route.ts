import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "../../_lib/backend-client";

const BACKEND_PATH = "/api/v1/auth/refresh";

export async function POST(request: NextRequest) {
  // Get refresh token from cookies
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { detail: "No refresh token available" },
      { status: 401 }
    );
  }

  // Call backend refresh endpoint
  const body = JSON.stringify({ refresh_token: refreshToken });
  const upstream = await proxyBackend(request, {
    path: BACKEND_PATH,
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    passThroughHeaders: ["content-type"],
  });

  const requestId = upstream.headers.get("X-Request-ID") ?? "";

  if (!upstream.ok) {
    const errorClone = upstream.clone();
    const errorPayload = await errorClone
      .json()
      .catch(() => ({ detail: "Token refresh failed" }));
    
    // Clear invalid tokens
    const errorResponse = NextResponse.json(errorPayload, {
      status: upstream.status,
    });
    errorResponse.cookies.delete("access_token");
    errorResponse.cookies.delete("refresh_token");
    
    if (requestId) {
      errorResponse.headers.set("X-Request-ID", requestId);
    }
    return errorResponse;
  }

  const cloned = upstream.clone();
  const data = await cloned.json();
  const nextResponse = NextResponse.json(data, { status: upstream.status });

  if (requestId) {
    nextResponse.headers.set("X-Request-ID", requestId);
  }

  // Update access token cookie (keep same refresh token)
  nextResponse.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return nextResponse;
}
