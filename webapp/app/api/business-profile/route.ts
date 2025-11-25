import { NextRequest } from "next/server";
import { proxyBackend } from "../_lib/backend-client";
import { isDevBypassEnabled, createMockBusinessProfileResponse } from "../auth/_lib/dev-bypass";

const BACKEND_PATH = "/api/v1/business-profile";

export async function GET(request: NextRequest) {
  // 🔓 DEV BYPASS: Return mock business profile without hitting backend
  if (isDevBypassEnabled()) {
    return createMockBusinessProfileResponse();
  }

  return proxyBackend(request, {
    path: BACKEND_PATH,
    method: "GET",
    headers: { "Content-Type": "application/json" },
    passThroughHeaders: ["content-type"],
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, {
    path: BACKEND_PATH,
    method: "PATCH",
    body,
    headers: { "Content-Type": "application/json" },
    passThroughHeaders: ["content-type"],
  });
}
