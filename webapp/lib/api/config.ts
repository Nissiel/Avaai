import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";
import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";

function parseResponse<T>(status: number, text: string | null, fallback: string): T {
  const parsed = safeJsonParse<T>(text, {
    context: `config:${status}`,
  });
  if (!parsed) {
    throw new Error(fallback);
  }
  return parsed;
}

export async function getStudioConfig(): Promise<StudioConfig> {
  const response = await apiFetch("/api/studio/config", {
    baseUrl: "relative",
    timeoutMs: 12_000,
    metricsLabel: "studio.config.get",
  });

  const text = await response.text();

  if (!response.ok) {
    const payload = safeJsonParse<{ detail?: string }>(text, {
      fallback: {},
      context: "config.getStudioConfig",
    }) ?? {};
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
    const errorPayload =
      safeJsonParse<{ detail?: string }>(text, {
        fallback: {},
        context: "config.updateStudioConfigClient",
      }) ?? {};
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
