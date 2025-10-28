import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";
import { useSessionStore } from "@/lib/stores/session-store";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getStudioConfig(): Promise<StudioConfig> {
  const session = useSessionStore.getState().session;
  const token = session?.accessToken;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BACKEND_URL}/api/v1/studio/config`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load studio config (status: ${response.status})`);
  }

  return response.json();
}

export async function updateStudioConfigClient(payload: StudioConfigUpdate): Promise<StudioConfig> {
  const session = useSessionStore.getState().session;
  const token = session?.accessToken;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BACKEND_URL}/api/v1/studio/config`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to update studio config: ${errorText}`);
  }

  return response.json();
}
