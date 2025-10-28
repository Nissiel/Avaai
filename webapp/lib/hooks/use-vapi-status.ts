"use client";

import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/session-store";

interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string;
}

/**
 * Hook to check if user has configured their Vapi API key
 * Returns loading state and configuration status
 */
export function useVapiStatus() {
  const { session } = useSessionStore((state) => ({ session: state.session }));

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings", session?.accessToken],
    queryFn: async () => {
      const token = session?.accessToken;
      if (!token) {
        throw new Error("No access token");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch Vapi settings");
      }

      return res.json();
    },
    enabled: !!session?.accessToken, // Only fetch if logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    hasVapiKey: data?.has_vapi_key ?? false,
    vapiKeyPreview: data?.vapi_api_key_preview,
    isLoading,
    refetch,
  };
}
