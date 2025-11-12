import { cache } from "react";
import { getBackendUrl } from "@/lib/config/env";
import { serverFetchBackend } from "@/lib/http/server-client";

type BackendAction = "start" | "stop" | "restart";

const BACKEND_BASE_URL = getBackendUrl();

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const runtimeStatusFetcher = cache(async () => {
  try {
    const response = await serverFetchBackend("/healthz", {
      method: "GET",
      headers: JSON_HEADERS,
      timeoutMs: 4_000,
      retries: 1,
    });

    if (!response.ok) {
      return {
        status: "unreachable" as const,
        url: BACKEND_BASE_URL,
        ok: false,
      };
    }

    const payload = await response.json().catch(() => ({}));
    return {
      status: payload.status ?? "ok",
      ok: true as const,
      url: BACKEND_BASE_URL,
    };
  } catch (error) {
    console.warn("Failed to contact backend health endpoint:", error);
    return {
      status: "offline" as const,
      url: BACKEND_BASE_URL,
      ok: false as const,
    };
  }
});

export async function getBackendRuntimeStatus() {
  return runtimeStatusFetcher();
}

export async function controlBackendRuntime(action: BackendAction) {
  const response = await serverFetchBackend("/api/v1/runtime/control", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ action }),
    timeoutMs: 5_000,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.detail ?? `Backend control failed with status ${response.status}`);
  }

  return response.json();
}

export const backendConfig = {
  baseUrl: BACKEND_BASE_URL,
};
