"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { getVapiSettings, type VapiSettings } from "@/lib/api/vapi-settings";

/**
 * 🔥 DIVINE: Hook to check if user has configured their Vapi API key
 * Uses centralized API with automatic token refresh on 401
 */
export function useVapiStatus() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      // 🔥 DIVINE: Use centralized API (has retry + token refresh built-in)
      return await getVapiSettings();
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
    staleTime: 0, // 🔥 DIVINE: Always fresh, credentials change frequently
    gcTime: 1000 * 60, // Keep in cache 1 minute only
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vapi-settings"] });
    queryClient.removeQueries({ queryKey: ["vapi-settings"] }); // Force removal
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
