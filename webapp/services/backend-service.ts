import { cache } from "react";

type BackendAction = "start" | "stop" | "restart";

const FALLBACK_BACKEND_URL = "http://localhost:8000";
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.APP_BACKEND_URL ??
  process.env.NEXT_PUBLIC_APP_BACKEND_URL ??
  FALLBACK_BACKEND_URL;

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const runtimeStatusFetcher = cache(async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/healthz`, {
      method: "GET",
      signal: controller.signal,
      headers: JSON_HEADERS,
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
  } finally {
    clearTimeout(timeout);
  }
});

export async function getBackendRuntimeStatus() {
  return runtimeStatusFetcher();
}

export async function controlBackendRuntime(action: BackendAction) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/v1/runtime/control`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ action }),
    next: { revalidate: 0 },
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
