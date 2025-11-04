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
    retry: 2, // 🔥 DIVINE: Max 2 retries to avoid infinite loading
    staleTime: 0, // 🔥 DIVINE: Always fresh, credentials change frequently
    gcTime: 1000 * 60, // Keep in cache 1 minute only
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
    queryClient.removeQueries({ queryKey: ["twilio-settings"] }); // Force removal
  };

  return {
    hasTwilioCredentials: data?.settings.configured ?? false,
    accountSidSet: data?.settings.account_sid_set ?? false,
    phoneNumber: data?.settings.phone_number,
    isLoading,
    refetch,
    invalidate, // 🔥 DIVINE: Expose invalidate for DELETE operations
    error,
  };
}
