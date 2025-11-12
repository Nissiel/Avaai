import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";

const NEXT_ROUTE = "/api/twilio-settings";

interface RawTwilioSettingsResponse {
  has_twilio_credentials: boolean;
  account_sid_preview?: string | null;
  phone_number?: string | null;
}

export interface TwilioSettingsResponse {
  configured: boolean;
  accountSidPreview?: string | null;
  phoneNumber?: string | null;
}

export interface SaveTwilioSettingsPayload {
  account_sid: string;
  auth_token: string;
  phone_number?: string;
}

function normalizeTwilioSettings(payload?: RawTwilioSettingsResponse | null): TwilioSettingsResponse {
  if (!payload) {
    return {
      configured: false,
      accountSidPreview: null,
      phoneNumber: null,
    };
  }

  return {
    configured: Boolean(payload.has_twilio_credentials),
    accountSidPreview: payload.account_sid_preview ?? null,
    phoneNumber: payload.phone_number ?? null,
  };
}

async function requestTwilioSettings(
  init: RequestInit & { metricsLabel: string; timeoutMs?: number },
): Promise<{ response: Response; text: string; payload: RawTwilioSettingsResponse | { detail?: string } | null }> {
  const { metricsLabel, timeoutMs = 10_000, ...fetchInit } = init;

  const response = await apiFetch(NEXT_ROUTE, {
    ...fetchInit,
    baseUrl: "relative",
    metricsLabel,
    timeoutMs,
  });

  const text = await response.text();
  const payload = safeJsonParse<RawTwilioSettingsResponse | { detail?: string }>(text, {
    fallback: null,
    context: `twilio-settings:${fetchInit.method ?? "GET"}`,
    onError: (_, raw) => ({ detail: raw.slice(0, 200) }),
  });
  return { response, text, payload };
}

export async function getTwilioSettings(): Promise<TwilioSettingsResponse> {
  const { response, payload } = await requestTwilioSettings({
    method: "GET",
    metricsLabel: "twilio.settings.get",
  });

  if (!response.ok) {
    const detail = formatDetail((payload as { detail?: unknown } | null)?.detail, `Twilio settings request failed (${response.status})`);
    throw new Error(detail);
  }

  return normalizeTwilioSettings(payload as RawTwilioSettingsResponse);
}

export async function saveTwilioSettings(payload: SaveTwilioSettingsPayload): Promise<TwilioSettingsResponse> {
  console.log("🔥 [saveTwilioSettings] Starting save with payload:", JSON.stringify({
    account_sid_length: payload.account_sid?.length,
    auth_token_length: payload.auth_token?.length,
    phone_number: payload.phone_number,
  }, null, 2));
  
  const { response, payload: resPayload } = await requestTwilioSettings({
    method: "POST",
    body: JSON.stringify(payload),
    metricsLabel: "twilio.settings.save",
  });

  console.log("📡 [saveTwilioSettings] Backend response status:", response.status);
  console.log("✅ [saveTwilioSettings] Backend returned payload:", JSON.stringify(resPayload, null, 2));

  if (!response.ok) {
    const detail = formatDetail((resPayload as { detail?: unknown } | null)?.detail, `Failed to save Twilio settings (${response.status})`);
    throw new Error(detail);
  }

  const normalized = normalizeTwilioSettings(resPayload as RawTwilioSettingsResponse);
  console.log("📊 [saveTwilioSettings] Normalized result:", JSON.stringify(normalized, null, 2));
  
  return normalized;
}

export async function deleteTwilioSettings(): Promise<void> {
  const { response, payload } = await requestTwilioSettings({
    method: "DELETE",
    metricsLabel: "twilio.settings.delete",
  });

  if (!response.ok) {
    const detail = formatDetail((payload as { detail?: unknown } | null)?.detail, `Failed to delete Twilio settings (${response.status})`);
    throw new Error(detail);
  }
}
function formatDetail(detail: unknown, fallback: string): string {
  if (!detail || (typeof detail === "string" && detail.trim().length === 0)) {
    return fallback;
  }

  if (typeof detail === "string") {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return fallback;
  }
}
