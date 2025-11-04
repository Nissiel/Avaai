/**
 * 🔥 DIVINE Auth Helper - localStorage as Single Source of Truth
 * 
 * ARCHITECTURE:
 * - localStorage = Source of Truth (persisted, reliable)
 * - Zustand = Reactive Cache (UI only, can be empty after refresh)
 * 
 * NEVER read from Zustand for API calls - it may be empty!
 * ALWAYS read from localStorage - it's stable across page reloads.
 * 
 * Fixes: "Unable to save at the moment" errors caused by race conditions
 * between Zustand hydration and API calls.
 */

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  
  // 🎯 DIVINE: ALWAYS read from localStorage (single source of truth)
  // Zustand may be empty after page refresh while bootstrapping
  const token = localStorage.getItem("access_token");
  
  return token || undefined;
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
