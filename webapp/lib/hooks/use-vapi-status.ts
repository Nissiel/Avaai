"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSessionStore } from "@/stores/session-store";
import { getVapiSettings, type VapiSettings } from "@/lib/api/vapi-settings";

function buildIdentityKey(userId: string | null, token: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (!token) {
    return "anonymous";
  }
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) | 0;
  }
  return `token:${Math.abs(hash)}`;
}

/**
 * 🔥 DIVINE: Hook to check if user has configured their Vapi API key
 * Uses centralized API with automatic token refresh on 401
 */
export function useVapiStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const queryClient = useQueryClient();
  const identityKey = useMemo(() => buildIdentityKey(userId, token), [userId, token]);

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings", identityKey],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      // 🔥 DIVINE: Use centralized API (has retry + token refresh built-in)
      return await getVapiSettings();
    },
    enabled: !!token,
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
