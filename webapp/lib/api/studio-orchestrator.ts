/**
 * 🔥 DIVINE ORCHESTRATOR - Studio Configuration Update
 *
 * Clean separation of concerns:
 * 1. Save to database (persistence)
 * 2. Sync to Vapi (external service)
 * 3. Orchestrate both operations
 */

import { apiFetch } from "@/lib/api/client";
import { syncStudioConfigToVapi } from "@/lib/api/studio-sync";
import { safeJsonParse } from "@/lib/utils/safe-json";
import type {
  DbSaveResult,
  VapiSyncResult,
  StudioUpdateResult
} from "@/lib/types/studio-update";
import type { StudioConfig } from "@/services/config-service";

/**
 * Save studio configuration to database via Next.js API route
 *
 * @param values - Configuration to save
 * @returns Result with success status and config or error
 */
export async function saveStudioConfigToDb(
  values: Partial<StudioConfig>
): Promise<DbSaveResult> {
  try {
    const response = await apiFetch("/api/config", {
      method: "POST",
      baseUrl: "relative",
      body: JSON.stringify(values),
      timeoutMs: 20_000,
      metricsLabel: "studio.config.save",
    });

    const text = await response.text();
    const payload =
      safeJsonParse<{ config?: StudioConfig; detail?: string; error?: string }>(text, {
        context: "studio.config.save",
        fallback: null,
      }) ?? null;

    if (!response.ok || !payload?.config) {
      const errorMessage = payload?.detail ?? payload?.error ?? `HTTP ${response.status}`;
      console.error("❌ DB Save Failed:", { status: response.status, payload, values });
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log("✅ DB Save Success:", payload);

    return {
      success: true,
      config: payload.config,
    };
  } catch (error: any) {
    console.error("❌ DB Save Exception:", error);
    return {
      success: false,
      error:
        error.name === "AbortError"
          ? "Save timed out. Please check your connection and try again."
          : error.message || "Failed to save configuration",
    };
  }
}

/**
 * Orchestrator: Save to DB + Sync to Vapi
 *
 * This is the main function that combines both operations.
 * DB save happens first (required), then Vapi sync (optional).
 *
 * @param values - Configuration to save and sync
 * @returns Combined result with both DB and Vapi status
 */
export async function updateStudioConfiguration(
  values: Partial<StudioConfig>,
  options?: { skipVapiSync?: boolean }
): Promise<StudioUpdateResult> {
  console.log("🚀 Studio Config Update Starting:", values);

  // Step 1: Save to database (CRITICAL - must succeed)
  const dbResult = await saveStudioConfigToDb(values);

  // If DB save failed, don't attempt Vapi sync
  if (!dbResult.success) {
    return {
      db: dbResult,
      vapi: {
        success: false,
        error: "Skipped due to DB save failure",
      },
    };
  }

  if (options?.skipVapiSync) {
    console.log("⚠️ Vapi sync skipped (not configured)");
    return {
      db: dbResult,
      vapi: {
        success: false,
        skipped: true,
        error: "Vapi sync skipped because Vapi API key is not configured.",
      },
    };
  }

  // Step 2: Sync to Vapi (OPTIONAL - can fail gracefully)
  const vapiResult = await syncStudioConfigToVapi();

  // Return combined result
  return {
    db: dbResult,
    vapi: vapiResult,
  };
}
