import { NextRequest } from "next/server";
import { proxyBackend } from "../../_lib/backend-client";

/**
 * PATCH /api/user/onboarding
 * Update onboarding flags for the current user
 */
export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, {
    path: "/api/v1/user/onboarding",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body && body.trim() ? body : "{}",
  });
}
