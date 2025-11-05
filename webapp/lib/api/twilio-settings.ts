/**
 * 🔥 DIVINE: Twilio Settings API Client
 * Centralized API calls with retry logic + token refresh
 */

import { getAuthHeaders } from "./auth-helper";
import { refreshAccessToken } from "@/lib/auth/session-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

function normalizeTwilioSettings(payload?: RawTwilioSettingsResponse): TwilioSettingsResponse {
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

async function handleMaybeRefresh<T>(
  request: () => Promise<Response>,
  retry: (newAccessToken: string) => Promise<Response>,
  transform?: (payload: RawTwilioSettingsResponse | undefined) => T,
): Promise<T> {
  const response = await request();

  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");

    if (typeof window !== "undefined") {
      const refreshToken = window.localStorage.getItem("refresh_token");
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          console.log("✅ Token refreshed! Retrying Twilio request...");
          const retryResponse = await retry(newAccessToken);
          if (retryResponse.ok) {
            if (retryResponse.status === 204) {
              return transform ? transform(undefined) : (undefined as T);
            }
            const data = (await retryResponse.json()) as RawTwilioSettingsResponse;
            if (transform) {
              return transform(data);
            }
            return data as unknown as T;
          }
        }
      }
    }

    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Twilio settings request failed" }));
    throw new Error(error.detail || "Twilio settings request failed");
  }

  if (response.status === 204) {
    return transform ? transform(undefined) : (undefined as T);
  }

  const data = (await response.json()) as RawTwilioSettingsResponse;
  if (transform) {
    return transform(data);
  }

  return data as unknown as T;
}

/**
 * Get current Twilio settings
 */
export async function getTwilioSettings(): Promise<TwilioSettingsResponse> {
  return handleMaybeRefresh(
    () =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "GET",
        headers: getAuthHeaders(),
      }),
    (token) =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    normalizeTwilioSettings,
  );
}

/**
 * Save Twilio credentials
 */
export async function saveTwilioSettings(payload: SaveTwilioSettingsPayload): Promise<TwilioSettingsResponse> {
  return handleMaybeRefresh(
    () =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }),
    (token) =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
    normalizeTwilioSettings,
  );
}

/**
 * Delete Twilio credentials
 */
export async function deleteTwilioSettings(): Promise<void> {
  await handleMaybeRefresh<void>(
    () =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    (token) =>
      fetch(`${API_URL}/api/v1/twilio-settings`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    () => undefined,
  );
}
