import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";

export async function getStudioConfig(): Promise<StudioConfig> {
  const response = await fetch("/api/config", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load studio config (status: ${response.status})`);
  }

  return response.json();
}

export async function updateStudioConfigClient(payload: StudioConfigUpdate): Promise<StudioConfig> {
  const response = await fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? "Failed to update studio config");
  }

  const data = await response.json();
  if (!data.success || !data.config) {
    throw new Error("Unexpected configuration response");
  }

  return data.config as StudioConfig;
}
