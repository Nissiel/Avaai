import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { getTwilioSettings, type TwilioSettingsResponse } from "@/lib/api/twilio-settings";

/**
 * 🔥 DIVINE: Hook to check Twilio credentials status
 * Uses centralized API with automatic token refresh on 401
 */
export function useTwilioStatus() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, error } = useQuery<TwilioSettingsResponse>({
    queryKey: ["twilio-settings"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      // 🔥 DIVINE: Use centralized API (has retry + token refresh built-in)
      return await getTwilioSettings();
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
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
