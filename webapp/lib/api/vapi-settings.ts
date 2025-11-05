/**
 * 🔥 DIVINE: Vapi Settings API Client
 * Centralized API calls with retry logic + token refresh
 */

import { getAuthHeaders } from "./auth-helper";
import { refreshAccessToken } from "@/lib/auth/session-client";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string | null;
}

/**
 * Get current Vapi settings
 */
export async function getVapiSettings(): Promise<VapiSettings> {
  const response = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  // 🔥 DIVINE: Auto token refresh on 401
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");

    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying getVapiSettings...");

        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
    }

    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch Vapi settings" }));
    throw new Error(error.detail || "Failed to fetch Vapi settings");
  }

  return await response.json();
}

/**
 * Save Vapi API key
 */
export async function saveVapiSettings(apiKey: string): Promise<VapiSettings> {
  const response = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ vapi_api_key: apiKey }),
  });

  // 🔥 DIVINE: Auto token refresh on 401
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");

    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying saveVapiSettings...");

        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
          body: JSON.stringify({ vapi_api_key: apiKey }),
        });

        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
    }

    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to save Vapi settings" }));
    throw new Error(error.detail || "Failed to save Vapi settings");
  }

  return await response.json();
}

/**
 * Delete Vapi API key
 */
export async function deleteVapiSettings(): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  // 🔥 DIVINE: Auto token refresh on 401
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");

    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying deleteVapiSettings...");

        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/vapi-settings`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        if (retryResponse.ok) {
          return;
        }
      }
    }

    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to delete Vapi settings" }));
    throw new Error(error.detail || "Failed to delete Vapi settings");
  }
}
