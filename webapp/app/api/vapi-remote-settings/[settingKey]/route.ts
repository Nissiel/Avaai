import { NextRequest } from "next/server";

import { proxyBackend } from "@/app/api/_lib/backend-client";

const BACKEND_PATH = "/api/v1/vapi/settings";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ settingKey: string }> }
) {
  const { settingKey } = await params;
  const body = await request.text();

  return proxyBackend(request, {
    path: `${BACKEND_PATH}/${encodeURIComponent(settingKey)}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
