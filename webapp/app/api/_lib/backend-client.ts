import { NextRequest, NextResponse } from "next/server";
import { serverFetchBackend } from "@/lib/http/server-client";

function resolveAuthToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return request.cookies.get("access_token")?.value ?? undefined;
}

export interface ProxyOptions {
  path: string;
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  timeoutMs?: number;
  passThroughHeaders?: string[];
}

export async function proxyBackend(request: NextRequest, options: ProxyOptions): Promise<NextResponse> {
  const {
    path,
    method = request.method,
    body = null,
    headers: extraHeaders,
    timeoutMs,
    passThroughHeaders = ["content-type", "content-length"],
  } = options;

  const headers = new Headers(extraHeaders);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  headers.set("X-Request-ID", requestId);

  const token = resolveAuthToken(request);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const backendResponse = await serverFetchBackend(path, {
    method,
    headers,
    body,
    authToken: token,
    timeoutMs,
    requestId,
  });

  const responseHeaders = new Headers();
  passThroughHeaders.forEach((header) => {
    const value = backendResponse.headers.get(header);
    if (value !== null) {
      responseHeaders.set(header, value);
    }
  });
  responseHeaders.set("X-Request-ID", requestId);

  const arrayBuffer = await backendResponse.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
