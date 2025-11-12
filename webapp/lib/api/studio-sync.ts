import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";
import type { VapiSyncResult } from "@/lib/types/studio-update";

const SYNC_ROUTE = "/api/studio/sync-vapi";

/**
 * 🔥 DIVINE: Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function syncStudioConfigToVapi() {
  return retryWithBackoff(async () => {
    const response = await apiFetch(SYNC_ROUTE, {
      method: "POST",
      body: "{}",
      baseUrl: "relative",
      timeoutMs: 20_000,
      metricsLabel: "studio.config.sync",
    });

    const text = await response.text();
    const payload =
      safeJsonParse<(VapiSyncResult & { detail?: string; message?: string }) | null>(text, {
        context: "studio.config.sync",
        fallback: null,
      }) ?? null;

    if (!response.ok || !payload) {
      const errorMessage = payload?.detail ?? payload?.message ?? `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    if (payload.success === false) {
      throw new Error(payload.error ?? "Vapi sync failed");
    }

    return payload;
  });
}
