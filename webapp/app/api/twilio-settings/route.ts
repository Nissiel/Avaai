import { NextRequest } from "next/server";

import { proxyBackend } from "@/app/api/_lib/backend-client";

const BACKEND_PATH = "/api/v1/twilio-settings";

export async function GET(request: NextRequest) {
  return proxyBackend(request, { path: BACKEND_PATH, method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, {
    path: BACKEND_PATH,
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(request: NextRequest) {
  return proxyBackend(request, { path: BACKEND_PATH, method: "DELETE" });
}
