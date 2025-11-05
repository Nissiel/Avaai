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
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    const errorMessage = errorData.detail || `HTTP ${response.status}`;
    console.error("❌ getStudioConfig failed:", { status: response.status, errorData });
    throw new Error(`Impossible de charger la configuration: ${errorMessage}`);
  }

  return response.json();
}

export async function updateStudioConfigClient(payload: StudioConfigUpdate): Promise<StudioConfig> {
  console.log("🔄 updateStudioConfigClient:", payload);

  const response = await fetch(`/api/studio/config`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    const errorMessage = errorData.detail || `HTTP ${response.status}`;
    console.error("❌ updateStudioConfigClient failed:", {
      status: response.status,
      errorData,
      payload,
    });
    throw new Error(`Impossible de sauvegarder: ${errorMessage}`);
  }

  console.log("✅ updateStudioConfigClient success");
  return response.json();
}
