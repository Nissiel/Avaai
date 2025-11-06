import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 15_000;

function resolveAuthToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return request.cookies.get("access_token")?.value ?? undefined;
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error as any).name = "AbortError";
  return error;
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
    timeoutMs = DEFAULT_TIMEOUT_MS,
    passThroughHeaders = ["content-type", "content-length"],
  } = options;

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(createAbortError("Backend request timeout")), timeoutMs);

  const headers = new Headers(extraHeaders);
  headers.set("X-Request-ID", requestId);

  const token = resolveAuthToken(request);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ?? undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

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
