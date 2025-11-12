import "server-only";

import { serverFetchBackend } from "@/lib/http/server-client";

export interface StudioConfig {
  // Organization
  organizationName: string;
  adminEmail: string;
  timezone: string;
  language: string;
  persona: string;
  tone: string;
  guidelines: string;
  phoneNumber: string;
  businessHours: string;
  fallbackEmail: string;
  summaryEmail: string;

  // SMTP (deprecated but kept for backward compatibility)
  smtpServer: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;

  // AI Performance (NEW)
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;

  // Voice Settings (NEW)
  voiceProvider: string;
  voiceId: string;
  voiceSpeed: number;

  // Conversation Behavior (NEW)
  systemPrompt: string;
  firstMessage: string;
  askForName: boolean;
  askForEmail: boolean;
  askForPhone: boolean;

  // Vapi Integration (NEW)
  vapiAssistantId: string | null;
}

export type StudioConfigUpdate = Partial<StudioConfig>;

const CONFIG_ENDPOINT = "/api/v1/studio/config";

export async function fetchStudioConfig(token?: string): Promise<StudioConfig> {
  console.log("🔥 Fetching studio config from:", CONFIG_ENDPOINT);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await serverFetchBackend(CONFIG_ENDPOINT, {
    method: "GET",
    headers,
    authToken: token,
  });

  console.log("🔥 Studio config response:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "No error details");
    console.error("❌ Studio config fetch failed:", errorText);
    throw new Error(`Failed to load studio config (status: ${response.status})`);
  }

  const data = await response.json();
  console.log("✅ Studio config loaded:", data);
  return data;
}

export async function updateStudioConfig(payload: StudioConfigUpdate, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await serverFetchBackend(CONFIG_ENDPOINT, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
    authToken: token,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail ?? "Failed to update studio config");
  }

  return response.json();
}
