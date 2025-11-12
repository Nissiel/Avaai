"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSessionStore } from "@/stores/session-store";
import { getVapiSettings, type VapiSettings } from "@/lib/api/vapi-settings";

/**
 * 🔥 DIVINE: Hook to check if user has configured their Vapi API key
 *
 * ARCHITECTURE:
 * - Backend isolates data per-user via JWT token (in Authorization header or cookie)
 * - Simple query key prevents race conditions when userId loads async
 * - Runs when EITHER userId OR token is present (supports HTTP-only cookies)
 * - Cache invalidation works via base key ["vapi-settings"]
 */
export function useVapiStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const isAuthenticated = Boolean(userId || token);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings"],
    queryFn: getVapiSettings,
    enabled: isAuthenticated,
    staleTime: 10_000,
    gcTime: 1000 * 60, // Keep in cache 1 minute only
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vapi-settings"] });
  };

  return {
    hasVapiKey: data?.has_vapi_key ?? false,
    configured: data?.has_vapi_key ?? false,
    keyPreview: data?.vapi_api_key_preview,
    isLoading,
    refetch,
    invalidate, // 🔥 DIVINE: Expose invalidate for DELETE operations
  };
}
