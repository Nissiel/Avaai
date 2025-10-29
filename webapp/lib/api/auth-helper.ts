/**
 * Divine Auth Helper - Get token from Zustand OR localStorage
 * Fixes: "Unable to save at the moment" errors when Zustand state is lost
 */

import { useSessionStore } from "@/lib/stores/session-store";

export function getAuthToken(): string | undefined {
  // Try Zustand store first
  const session = useSessionStore.getState().session;
  let token = session?.accessToken;
  
  // Fallback: localStorage (survives page reloads)
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || undefined;
  }
  
  return token;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}
