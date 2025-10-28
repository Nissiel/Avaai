import "server-only";

import { backendConfig } from "@/services/backend-service";

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

const CONFIG_ENDPOINT = `${backendConfig.baseUrl}/api/v1/studio/config`;

export async function fetchStudioConfig(): Promise<StudioConfig> {
  console.log("🔥 Fetching studio config from:", CONFIG_ENDPOINT);
  
  const response = await fetch(CONFIG_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
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

export async function updateStudioConfig(payload: StudioConfigUpdate) {
  const response = await fetch(CONFIG_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail ?? "Failed to update studio config");
  }

  return response.json();
}
