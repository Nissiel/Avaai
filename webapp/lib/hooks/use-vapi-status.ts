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
 *
 * Key principles:
 * - Cache is namespaced per user to avoid leaking status between accounts
 * - Token is optional; cookies can authenticate requests, so we don't block if it's missing
 * - Query only runs once we know the user is authenticated (userId or token present)
 */
export function useVapiStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const isAuthenticated = Boolean(userId || token);
  const identityKey = useMemo(() => buildIdentityKey(userId, token), [userId, token]);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<VapiSettings>({
    queryKey: ["vapi-settings", identityKey],
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
