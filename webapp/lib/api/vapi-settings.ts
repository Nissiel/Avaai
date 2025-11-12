"use client";

import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";

const NEXT_ROUTE = "/api/vapi-settings";

export interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string | null;
}

function normalize(payload?: VapiSettings | null): VapiSettings {
  if (!payload) {
    return {
      has_vapi_key: false,
      vapi_api_key_preview: null,
    };
  }

  return {
    has_vapi_key: Boolean(payload.has_vapi_key),
    vapi_api_key_preview: payload.vapi_api_key_preview ?? null,
  };
}

function formatVapiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  if (!detail) {
    return fallback;
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return fallback;
  }
}

async function fetchSettings(
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
  metricsLabel?: string,
) {
  const response = await apiFetch(NEXT_ROUTE, {
    method,
    baseUrl: "relative",
    body: body ? JSON.stringify(body) : undefined,
    metricsLabel: metricsLabel ?? `vapi.settings.${method.toLowerCase()}`,
    timeoutMs: 10_000,
  });

  const text = await response.text();
  const payload = safeJsonParse<VapiSettings | { detail?: string }>(text, {
    fallback: null,
    context: `vapi-settings:${method}`,
    onError: (_, raw) => ({ detail: raw.slice(0, 200) }),
  });

  if (!response.ok) {
    const detail = formatVapiDetail((payload as { detail?: unknown } | null)?.detail, "Failed to process Vapi settings request");
    throw new Error(detail);
  }

  return payload as VapiSettings | null;
}

export async function getVapiSettings(): Promise<VapiSettings> {
  const payload = await fetchSettings("GET", undefined, "vapi.settings.get");
  return normalize(payload);
}

export async function saveVapiSettings(apiKey: string): Promise<VapiSettings> {
  console.log("🔥 [saveVapiSettings] Starting save with key length:", apiKey.length);
  
  const payload = await fetchSettings(
    "POST",
    { vapi_api_key: apiKey },
    "vapi.settings.save",
  );
  
  console.log("✅ [saveVapiSettings] Backend returned payload:", JSON.stringify(payload, null, 2));
  
  const normalized = normalize(payload);
  console.log("📊 [saveVapiSettings] Normalized result:", JSON.stringify(normalized, null, 2));
  
  return normalized;
}

export async function deleteVapiSettings(): Promise<void> {
  await fetchSettings("DELETE", undefined, "vapi.settings.delete");
}
