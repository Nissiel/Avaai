import { NextRequest } from "next/server";
import { proxyBackend } from "../../../_lib/backend-client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const callId = encodeURIComponent(params.id);
  return proxyBackend(request, {
    path: `/api/v1/analytics/calls/${callId}/email`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    passThroughHeaders: ["content-type"],
  });
}
