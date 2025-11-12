import { NextRequest } from "next/server";

import { proxyBackend } from "@/app/api/_lib/backend-client";

const BACKEND_PATH = "/api/v1/vapi/settings";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  const path = search ? `${BACKEND_PATH}${search}` : BACKEND_PATH;

  return proxyBackend(request, {
    path,
    method: "GET",
  });
}
