import { NextRequest } from "next/server";
import { proxyBackend } from "../_lib/backend-client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const path = `/api/v1/calls${queryString ? `?${queryString}` : ""}`;

  return proxyBackend(request, {
    path,
    method: "GET",
    passThroughHeaders: ["content-type"],
  });
}
