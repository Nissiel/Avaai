import { randomUUID } from "crypto";
import { getBackendUrl } from "@/lib/config/env";
import { serverLogger } from "@/lib/logging/server-logger";

const DEFAULT_TIMEOUT_MS = 25_000; // 🔥 DIVINE FIX: 25 seconds to handle cold Supabase database

export interface ServerRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  authToken?: string | null;
  timeoutMs?: number;
  requestId?: string;
  retries?: number;
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function serverFetchBackend(path: string, options: ServerRequestOptions = {}): Promise<Response> {
  const method = options.method?.toUpperCase() ?? "GET";
  const maxRetries = options.retries ?? (method === "GET" ? 1 : 0);
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    const requestId = options.requestId ?? randomUUID();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error("Backend request timed out")),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    try {
      const headers = new Headers(options.headers);
      headers.set("X-Request-ID", requestId);

      if (options.authToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${options.authToken}`);
      }

      if (!headers.has("Content-Type") && typeof options.body === "string") {
        headers.set("Content-Type", "application/json");
      }

      const url = resolveUrl(path);
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ?? undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      serverLogger.info("Backend request completed", {
        requestId,
        url,
        status: response.status,
        attempt,
      });

      if (!response.ok && attempt < maxRetries) {
        attempt += 1;
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      serverLogger.error("Backend request failed", {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        attempt,
      });

      if (attempt >= maxRetries) {
        throw error instanceof Error ? error : new Error(String(error));
      }

      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Backend request failed");
}
