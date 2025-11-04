/**
 * 🔥 DIVINE: Centralized Auth Token Hook
 * 
 * PROBLEM SOLVED:
 * - All hooks were reading from Zustand (useSessionStore)
 * - Zustand can be empty after page refresh → Race condition
 * - Causes: Infinite loops, failed requests, "backend disconnect"
 * 
 * SOLUTION:
 * - Single hook that ALWAYS reads from localStorage
 * - localStorage = Single Source of Truth (persists across reloads)
 * - No more race conditions!
 * 
 * USAGE:
 * ```ts
 * const token = useAuthToken();
 * 
 * const { data } = useQuery({
 *   queryKey: ["my-data"],
 *   queryFn: async () => {
 *     const response = await fetch(url, {
 *       headers: { Authorization: `Bearer ${token}` }
 *     });
 *     return response.json();
 *   },
 *   enabled: !!token, // Only run if token exists
 * });
 * ```
 */

import { useEffect, useState } from "react";

/**
 * Hook that returns the authentication token from localStorage.
 * 
 * This hook:
 * - Reads from localStorage (reliable, persisted)
 * - Re-renders on storage changes
 * - Works across page reloads
 * - Never has race conditions
 * 
 * @returns Authentication token or null
 */
export function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage on mount
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  });

  useEffect(() => {
    // Listen for storage changes (logout, login from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        setToken(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events (same-tab updates)
    const handleTokenChange = () => {
      setToken(localStorage.getItem("access_token"));
    };

    window.addEventListener("token-change", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("token-change", handleTokenChange);
    };
  }, []);

  return token;
}

/**
 * Helper to get token synchronously (for non-React code).
 * 
 * Use this in utility functions, API helpers, etc.
 */
export function getAuthTokenSync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
