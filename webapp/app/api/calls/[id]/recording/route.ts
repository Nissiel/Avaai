import { NextRequest } from "next/server";
import { proxyBackend } from "../../../_lib/backend-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const callId = encodeURIComponent(params.id);
  return proxyBackend(request, {
    path: `/api/v1/calls/${callId}/recording`,
    method: "GET",
    passThroughHeaders: ["content-type"],
  });
}
