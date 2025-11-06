import { apiFetch } from "@/lib/api/client";
import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";

function parseResponse<T>(status: number, text: string | null, fallback: string): T {
  if (!text) {
    throw new Error(fallback);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Failed to parse studio config response", error);
    throw new Error(fallback);
  }
}

export async function getStudioConfig(): Promise<StudioConfig> {
  const response = await apiFetch("/api/studio/config", {
    baseUrl: "relative",
    timeoutMs: 12_000,
    metricsLabel: "studio.config.get",
  });

  const text = await response.text();

  if (!response.ok) {
    let payload: { detail?: string } = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.error("Failed to parse studio config error payload", error);
      }
    }
    const errorMessage = payload.detail ?? `HTTP ${response.status}`;
    console.error("❌ getStudioConfig failed:", { status: response.status, payload });
    throw new Error(`Impossible de charger la configuration: ${errorMessage}`);
  }

  return parseResponse<StudioConfig>(response.status, text, "Invalid studio config payload");
}

export async function updateStudioConfigClient(payload: StudioConfigUpdate): Promise<StudioConfig> {
  console.log("🔄 updateStudioConfigClient:", payload);

  const response = await apiFetch("/api/studio/config", {
    method: "PATCH",
    baseUrl: "relative",
    timeoutMs: 12_000,
    body: JSON.stringify(payload),
    metricsLabel: "studio.config.update",
  });

  const text = await response.text();

  if (!response.ok) {
    let errorPayload: { detail?: string } = {};
    if (text) {
      try {
        errorPayload = JSON.parse(text);
      } catch (error) {
        console.error("Failed to parse studio config error payload", error);
      }
    }
    const errorMessage = errorPayload.detail ?? `HTTP ${response.status}`;
    console.error("❌ updateStudioConfigClient failed:", {
      status: response.status,
      errorPayload,
      payload,
    });
    throw new Error(`Impossible de sauvegarder: ${errorMessage}`);
  }

  console.log("✅ updateStudioConfigClient success");
  return parseResponse<StudioConfig>(response.status, text, "Invalid studio config payload");
}
