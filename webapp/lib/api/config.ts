import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";
import { getAuthHeaders } from "./auth-helper";

/**
 * 🎯 DIVINE FIX: Use Next.js API routes to avoid CORS issues
 * Frontend calls /api/studio/config → Next.js proxies to backend
 */

export async function getStudioConfig(): Promise<StudioConfig> {
  const response = await fetch(`/api/studio/config`, {
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
  const response = await fetch(`/api/studio/config`, {
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
