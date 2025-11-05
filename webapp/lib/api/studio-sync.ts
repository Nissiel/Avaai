/**
 * 🔥 DIVINE STUDIO SYNC - Uses the PROVEN working endpoint
 *
 * BREAKTHROUGH: Onboarding uses /api/v1/assistants and it WORKS PERFECTLY.
 * Studio Settings was using /sync-vapi which doesn't work.
 *
 * SOLUTION: Use the SAME endpoint as onboarding!
 *
 * DIVINE CODEX: DRY - Don't Repeat Yourself. Reuse what works!
 */

import { refreshAccessToken } from "@/lib/auth/session-client";
import type { StudioConfigInput } from "@/lib/validations/config";

/**
 * Get backend URL from environment
 */
function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/**
 * Get auth headers with token
 */
function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Map Studio Config to Assistant API payload
 *
 * Backend expects: voice_provider, voice_id, system_prompt, etc.
 * Frontend has: voiceProvider, voiceId, systemPrompt, etc.
 */
export function mapStudioConfigToAssistantPayload(config: StudioConfigInput) {
  return {
    name: `${config.organizationName} Assistant`,
    voice_provider: config.voiceProvider,
    voice_id: config.voiceId,
    voice_speed: config.voiceSpeed,
    first_message: config.firstMessage,
    system_prompt: config.systemPrompt,  // 🔥 NOW SUPPORTED!
    model_provider: "openai",
    model: config.aiModel,
    temperature: config.aiTemperature,
    max_tokens: config.aiMaxTokens,
    transcriber_provider: config.transcriberProvider,
    transcriber_model: config.transcriberModel,
    transcriber_language: config.transcriberLanguage,
    metadata: {
      organizationName: config.organizationName,
      persona: config.persona,
      tone: config.tone,
      language: config.language,
    },
  };
}

/**
 * Sync Studio Config to Vapi using /api/v1/assistants
 *
 * This is the SAME endpoint that onboarding uses, and it WORKS!
 *
 * @param config - Studio configuration to sync
 * @param assistantId - Existing assistant ID (for update) or null (for create)
 * @returns Assistant data from Vapi
 */
/**
 * 🔥 DIVINE: Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function syncStudioConfigToVapi(
  config: StudioConfigInput,
  assistantId: string | null = null
): Promise<{
  success: boolean;
  assistant?: any;
  error?: string;
}> {
  console.log("🔥 DIVINE SYNC: Using /api/v1/assistants (proven working endpoint)");

  // Build payload
  const payload = mapStudioConfigToAssistantPayload(config);
  console.log("🔍 Payload:", payload);

  // Get token
  let token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // Determine method and URL
  const method = assistantId ? "PATCH" : "POST";
  const url = assistantId
    ? `${getBackendUrl()}/api/v1/assistants/${assistantId}`
    : `${getBackendUrl()}/api/v1/assistants`;

  console.log(`🔥 ${method} ${url}`);

  const requestWithTimeout = async (authToken?: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);
    try {
      return await fetch(url, {
        method,
        headers: getAuthHeaders(authToken),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    // 🔥 DIVINE: Wrap fetch in retry logic (handles transient network errors)
    const data = await retryWithBackoff(async () => {
      // Make request
      let response = await requestWithTimeout(token || undefined);

      // Handle 401 - try token refresh
      if (response.status === 401) {
        console.log("⚠️ 401 Unauthorized - Attempting token refresh...");

        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);

          if (newAccessToken) {
            console.log("✅ Token refreshed! Retrying...");
            token = newAccessToken;

            // Retry with new token
            response = await requestWithTimeout(token);
          }
        }

        // If still 401, throw
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
      }

      // Handle error response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `HTTP ${response.status}`;

        console.error("❌ Sync failed:", {
          status: response.status,
          error: errorMessage,
          url,
        });

        // Throw to trigger retry
        throw new Error(errorMessage);
      }

      // Success! Return data
      return await response.json();
    }, 3, 1000); // 3 retries, 1s initial delay

    console.log("✅ Sync SUCCESS:", data);

    return {
      success: true,
      assistant: data.assistant || data,
    };

  } catch (error: any) {
    console.error("❌ Sync exception (after all retries):", error);
    return {
      success: false,
      error:
        error?.name === "AbortError"
          ? "Sync timed out. We'll keep your settings and you can retry in a moment."
          : error?.message || "Unknown error",
    };
  }
}
