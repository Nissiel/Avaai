import { NextRequest } from "next/server";

import { proxyBackend } from "@/app/api/_lib/backend-client";

const BACKEND_PATH = "/api/v1/analytics/calls";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  const body = await request.text();

  return proxyBackend(request, {
    path: `${BACKEND_PATH}/${encodeURIComponent(callId)}/email`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
