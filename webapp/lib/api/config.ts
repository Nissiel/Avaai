import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";
import { getBackendBaseUrl } from "@/lib/auth/session-client";
import { getAuthHeaders } from "./auth-helper";

export async function getStudioConfig(): Promise<StudioConfig> {
  const response = await fetch(`${getBackendBaseUrl()}/api/v1/studio/config`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load studio config (status: ${response.status})`);
  }

  return response.json();
}

export async function updateStudioConfigClient(payload: StudioConfigUpdate): Promise<StudioConfig> {
  const response = await fetch(`${getBackendBaseUrl()}/api/v1/studio/config`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to update studio config: ${errorText}`);
  }

  return response.json();
}
