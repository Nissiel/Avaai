import { NextRequest } from "next/server";
import { proxyBackend } from "../../_lib/backend-client";

const BACKEND_PATH = "/api/v1/auth/me";

export async function GET(request: NextRequest) {
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
