"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { refreshAccessToken } from "@/lib/auth/session-client";

interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string;
}

/**
 * 🎯 DIVINE: Hook to check if user has configured their Vapi API key
 * With automatic token refresh on 401 and proper cache invalidation
 */
export function useVapiStatus() {
  const token = useAuthToken(); // 🔥 DIVINE: localStorage as Single Source of Truth
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🎯 DIVINE: If 401, try to refresh token automatically
      if (res.status === 401) {
        console.log("⚠️ useVapiStatus: 401 Unauthorized - Attempting token refresh...");
        
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);
          
          if (newAccessToken) {
            console.log("✅ useVapiStatus: Token refreshed! Retrying...");
            
            // Retry the request with new token
            const retryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            });
            
            if (retryRes.ok) {
              return retryRes.json();
            }
          }
        }
        
        throw new Error("Session expired. Please login again.");
      }

      if (!res.ok) {
        throw new Error("Failed to fetch Vapi settings");
      }

      return res.json();
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
    staleTime: 0, // 🔥 DIVINE: Always fresh, credentials change frequently
    gcTime: 1000 * 60, // Keep in cache 1 minute only (renamed from cacheTime in React Query v5)
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vapi-settings"] });
    queryClient.removeQueries({ queryKey: ["vapi-settings"] }); // Force removal
  };

  return {
    hasVapiKey: data?.has_vapi_key ?? false,
    vapiKeyPreview: data?.vapi_api_key_preview,
    isLoading,
    refetch,
    invalidate, // 🔥 DIVINE: Expose invalidate for DELETE operations
  };
}
