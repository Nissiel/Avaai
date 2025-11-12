import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSessionStore } from "@/stores/session-store";
import { getTwilioSettings, type TwilioSettingsResponse } from "@/lib/api/twilio-settings";

/**
 * 🔥 DIVINE: Hook to check Twilio credentials status
 * 
 * ARCHITECTURE:
 * - Backend isolates data per-user via JWT token (in Authorization header or cookie)
 * - Simple query key prevents race conditions when userId loads async
 * - Runs when EITHER userId OR token is present (supports HTTP-only cookies)
 * - Cache invalidation works via base key ["twilio-settings"]
 */
export function useTwilioStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const isAuthenticated = Boolean(userId || token);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, error } = useQuery<TwilioSettingsResponse>({
    queryKey: ["twilio-settings"],
    queryFn: getTwilioSettings,
    enabled: isAuthenticated,
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
