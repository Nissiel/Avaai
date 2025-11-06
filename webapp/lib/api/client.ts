"use client";

import { clientLogger } from "../logging/client-logger";
import { getAuthTokenSync } from "../hooks/use-auth-token";
import { refreshAccessToken, getBackendBaseUrl } from "../auth/session-client";

type BaseUrlMode = "backend" | "relative" | "absolute";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  dedupeKey?: string;
  requestId?: string;
  timeoutMs?: number;
  baseUrl?: BaseUrlMode;
  metricsLabel?: string;
};

const inflightControllers = new Map<string, AbortController>();
let refreshPromise: Promise<string | null> | null = null;
const DEFAULT_TIMEOUT_MS = 20_000;

function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function resolveEndpoint(input: string, baseUrl?: BaseUrlMode): { url: string; mode: BaseUrlMode } {
  if (baseUrl === "absolute") {
    return { url: input, mode: "absolute" };
  }

  if (/^https?:\/\//i.test(input)) {
    return { url: input, mode: "absolute" };
  }

  if (baseUrl === "relative" || input.startsWith("/api/")) {
    return { url: input, mode: "relative" };
  }

  const normalized = input.startsWith("/") ? input : `/${input}`;
  return { url: `${getBackendBaseUrl()}${normalized}`, mode: "backend" };
}

function buildHeaders(options: ApiRequestOptions, requestId: string): Headers {
  const headers = new Headers(options.headers);
  headers.set("X-Request-ID", requestId);

  if (options.auth !== false) {
    const token = getAuthTokenSync();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

type NamedError = Error & { name: string };

function createAbortError(message: string, name: string): DOMException | NamedError {
  try {
    return new DOMException(message, name);
  } catch {
    const error = new Error(message) as NamedError;
    error.name = name;
    return error;
  }
}

async function singleFlightRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken =
    typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
  if (!refreshToken) {
    return null;
  }

  refreshPromise = refreshAccessToken(refreshToken);
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function recordMetrics(label: string, data: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    const globalObject = window as unknown as {
      __AVA_METRICS__?: { requests: Record<string, unknown> };
    };
    if (!globalObject.__AVA_METRICS__) {
      globalObject.__AVA_METRICS__ = { requests: {} };
    }
    globalObject.__AVA_METRICS__.requests[label] = {
      ...data,
      ts: new Date().toISOString(),
    };
  }
}

export async function apiFetch(input: string, options: ApiRequestOptions = {}): Promise<Response> {
  const {
    auth,
    dedupeKey,
    requestId: providedRequestId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrl,
    metricsLabel,
    signal,
    ...fetchInit
  } = options;

  const requestId =
    providedRequestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener(
        "abort",
        () => {
          controller.abort(signal.reason);
        },
        { once: true },
      );
    }
  }

  if (dedupeKey) {
    const previous = inflightControllers.get(dedupeKey);
    previous?.abort(createAbortError("Deduplicated by apiFetch", "AbortError"));
    inflightControllers.set(dedupeKey, controller);
  }

  const { url: endpoint, mode } = resolveEndpoint(input, baseUrl);
  const headers = buildHeaders({ ...options, auth }, requestId);

  const timeoutId = setTimeout(() => {
    controller.abort(createAbortError("Request timed out", "TimeoutError"));
  }, timeoutMs);

  const startedAt = now();

  const exec = async () =>
    fetch(endpoint, {
      ...fetchInit,
      headers,
      signal: controller.signal,
      credentials:
        fetchInit.credentials ?? (mode === "relative" ? ("same-origin" as RequestCredentials) : undefined),
    });

  let response: Response;
  try {
    response = await exec();

    if (response.status === 401 && auth !== false) {
      clientLogger.warn("Received 401, attempting token refresh", { requestId, endpoint });
      await singleFlightRefresh();
      const retryHeaders = buildHeaders({ ...options, auth }, requestId);
      response = await fetch(endpoint, {
        ...fetchInit,
        headers: retryHeaders,
        signal: controller.signal,
        credentials:
          fetchInit.credentials ?? (mode === "relative" ? ("same-origin" as RequestCredentials) : undefined),
      });
    }
  } finally {
    clearTimeout(timeoutId);
    if (dedupeKey) {
      const current = inflightControllers.get(dedupeKey);
      if (current === controller) {
        inflightControllers.delete(dedupeKey);
      }
    }
  }

  const durationMs = Math.round(now() - startedAt);
  const metricKey = metricsLabel ?? endpoint;
  recordMetrics(metricKey, {
    requestId,
    status: response.status,
    durationMs,
    dedupeKey,
  });

  clientLogger.info("apiFetch completed", {
    requestId,
    url: endpoint,
    status: response.status,
    durationMs,
    dedupeKey,
  });

  return response;
}
