"use client";

import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/session-store";
import { refreshAccessToken } from "@/lib/auth/session-client";

interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string;
}

/**
 * 🎯 DIVINE: Hook to check if user has configured their Vapi API key
 * With automatic token refresh on 401
 */
export function useVapiStatus() {
  const { session } = useSessionStore((state) => ({ session: state.session }));

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings", session?.accessToken],
    queryFn: async () => {
      // 🎯 DIVINE: Fallback to localStorage if session store empty
      const token = session?.accessToken || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
      
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
    enabled: !!session?.accessToken || (typeof window !== "undefined" && !!localStorage.getItem("access_token")), // Fetch if token exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    hasVapiKey: data?.has_vapi_key ?? false,
    vapiKeyPreview: data?.vapi_api_key_preview,
    isLoading,
    refetch,
  };
}
