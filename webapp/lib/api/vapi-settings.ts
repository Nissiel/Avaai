"use client";

import { apiFetch } from "@/lib/api/client";

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
  const payload = text ? (JSON.parse(text) as VapiSettings | { detail?: string }) : null;

  if (!response.ok) {
    const detail = (payload as { detail?: string } | null)?.detail ?? "Failed to process Vapi settings request";
    throw new Error(detail);
  }

  return payload as VapiSettings | null;
}

export async function getVapiSettings(): Promise<VapiSettings> {
  const payload = await fetchSettings("GET", undefined, "vapi.settings.get");
  return normalize(payload);
}

export async function saveVapiSettings(apiKey: string): Promise<VapiSettings> {
  const payload = await fetchSettings(
    "POST",
    { vapi_api_key: apiKey },
    "vapi.settings.save",
  );
  return normalize(payload);
}

export async function deleteVapiSettings(): Promise<void> {
  await fetchSettings("DELETE", undefined, "vapi.settings.delete");
}
