import { apiFetch } from "@/lib/api/client";

const BACKEND_ROUTE = "/api/v1/twilio-settings";

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

  const response = await apiFetch(BACKEND_ROUTE, {
    ...fetchInit,
    baseUrl: "backend",
    metricsLabel,
    timeoutMs,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as RawTwilioSettingsResponse | { detail?: string }) : null;
  return { response, text, payload };
}

export async function getTwilioSettings(): Promise<TwilioSettingsResponse> {
  const { response, payload } = await requestTwilioSettings({
    method: "GET",
    metricsLabel: "twilio.settings.get",
  });

  if (!response.ok) {
    const detail = (payload as { detail?: string } | null)?.detail ?? `Twilio settings request failed (${response.status})`;
    throw new Error(detail);
  }

  return normalizeTwilioSettings(payload as RawTwilioSettingsResponse);
}

export async function saveTwilioSettings(payload: SaveTwilioSettingsPayload): Promise<TwilioSettingsResponse> {
  const { response, payload: raw } = await requestTwilioSettings({
    method: "POST",
    body: JSON.stringify(payload),
    metricsLabel: "twilio.settings.save",
    timeoutMs: 15_000,
  });

  if (!response.ok) {
    const detail = (raw as { detail?: string } | null)?.detail ?? `Failed to save Twilio settings (${response.status})`;
    throw new Error(detail);
  }

  return normalizeTwilioSettings(raw as RawTwilioSettingsResponse);
}

export async function deleteTwilioSettings(): Promise<void> {
  const { response, payload } = await requestTwilioSettings({
    method: "DELETE",
    metricsLabel: "twilio.settings.delete",
  });

  if (!response.ok) {
    const detail = (payload as { detail?: string } | null)?.detail ?? `Failed to delete Twilio settings (${response.status})`;
    throw new Error(detail);
  }
}
