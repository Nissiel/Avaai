"use client";

import { clientLogger } from "../logging/client-logger";
import { getAuthTokenSync } from "../hooks/use-auth-token";
import { refreshAccessToken, getBackendBaseUrl } from "../auth/session-client";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  dedupeKey?: string;
  requestId?: string;
};

const inflightControllers = new Map<string, AbortController>();
let refreshPromise: Promise<string | null> | null = null;

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

export async function apiFetch(input: string, options: ApiRequestOptions = {}): Promise<Response> {
  const requestId = options.requestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
  const controller = new AbortController();
  const { signal } = options;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  if (options.dedupeKey) {
    const existing = inflightControllers.get(options.dedupeKey);
    existing?.abort();
    inflightControllers.set(options.dedupeKey, controller);
  }

  const headers = buildHeaders(options, requestId);
  const endpoint = input.startsWith("http") ? input : `${getBackendBaseUrl()}${input.startsWith("/") ? input : `/${input}`}`;

  const exec = async () =>
    fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal,
    });

  let response = await exec();

  if (response.status === 401 && options.auth !== false) {
    clientLogger.warn("Received 401, attempting token refresh", { requestId });
    await singleFlightRefresh();
    const refreshedHeaders = buildHeaders(options, requestId);
    response = await fetch(endpoint, {
      ...options,
      headers: refreshedHeaders,
      signal: controller.signal,
    });
  }

  inflightControllers.delete(options.dedupeKey ?? "");
  clientLogger.info("apiFetch completed", {
    requestId,
    url: endpoint,
    status: response.status,
  });

  return response;
}
