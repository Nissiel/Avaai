import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSessionStore } from "@/stores/session-store";
import { getTwilioSettings, type TwilioSettingsResponse } from "@/lib/api/twilio-settings";

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
 * 🔥 DIVINE: Hook to check Twilio credentials status
 * Uses centralized API with automatic token refresh on 401
 */
export function useTwilioStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const queryClient = useQueryClient();
  const identityKey = useMemo(() => buildIdentityKey(userId, token), [userId, token]);

  const { data, isLoading, refetch, error } = useQuery<TwilioSettingsResponse>({
    queryKey: ["twilio-settings", identityKey],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      // 🔥 DIVINE: Use centralized API (has retry + token refresh built-in)
      return await getTwilioSettings();
    },
    enabled: !!token,
    retry: 1, // 🔥 DIVINE: Limit retries to reduce perceived lag
    staleTime: 10_000,
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
  };

  return {
    hasTwilioCredentials: data?.configured ?? false,
    accountSidSet: data?.configured ?? false,
    accountSidPreview: data?.accountSidPreview ?? undefined,
    phoneNumber: data?.phoneNumber ?? undefined,
    settings: data,
    isLoading,
    refetch,
    invalidate, // 🔥 DIVINE: Expose invalidate for DELETE operations
    error,
  };
}
