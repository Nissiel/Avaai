import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "../../_lib/backend-client";

const BACKEND_PATH = "/api/v1/auth/login";

export async function POST(request: NextRequest) {
  const body = await request.text();
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
    const errorPayload = await errorClone.json().catch(() => ({ detail: "Login failed" }));
    const errorResponse = NextResponse.json(errorPayload, { status: upstream.status });
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

  nextResponse.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  nextResponse.cookies.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return nextResponse;
}
