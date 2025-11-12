import { NextRequest } from "next/server";
import { proxyBackend } from "../../_lib/backend-client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, {
    path: "/api/v1/auth/signup",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body && body.trim() ? body : "{}",
  });
}
