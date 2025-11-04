/**
 * 🔥 DIVINE: Twilio Settings API Client
 * Centralized API calls with retry logic + token refresh
 */

import { getAuthHeaders } from "./auth-helper";
import { refreshAccessToken } from "@/lib/auth/session-client";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export interface TwilioSettings {
  configured: boolean;
  account_sid_set: boolean;
  auth_token_set: boolean;
  phone_number?: string;
}

export interface TwilioSettingsResponse {
  success: boolean;
  settings: TwilioSettings;
}

export interface SaveTwilioSettingsPayload {
  account_sid: string;
  auth_token: string;
  phone_number?: string;
}

/**
 * Get current Twilio settings
 */
export async function getTwilioSettings(): Promise<TwilioSettingsResponse> {
  const response = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
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
        console.log("✅ Token refreshed! Retrying getTwilioSettings...");
        
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
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
    const error = await response.json().catch(() => ({ detail: "Failed to fetch Twilio settings" }));
    throw new Error(error.detail || "Failed to fetch Twilio settings");
  }

  return await response.json();
}

/**
 * Save Twilio credentials
 */
export async function saveTwilioSettings(payload: SaveTwilioSettingsPayload): Promise<TwilioSettingsResponse> {
  const response = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // 🔥 DIVINE: Auto token refresh on 401
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");
    
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      
      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying saveTwilioSettings...");
        
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
    }
    
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to save Twilio settings" }));
    throw new Error(error.detail || "Failed to save Twilio settings");
  }

  return await response.json();
}

/**
 * Delete Twilio credentials
 */
export async function deleteTwilioSettings(): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
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
        console.log("✅ Token refreshed! Retrying deleteTwilioSettings...");
        
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/twilio-settings`, {
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
    const error = await response.json().catch(() => ({ detail: "Failed to delete Twilio settings" }));
    throw new Error(error.detail || "Failed to delete Twilio settings");
  }
}
