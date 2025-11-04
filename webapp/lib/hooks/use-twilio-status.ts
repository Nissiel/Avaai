import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";

interface TwilioStatusResponse {
  has_twilio_credentials: boolean;
  account_sid_preview?: string;
  phone_number?: string;
}

export function useTwilioStatus() {
  const token = useAuthToken(); // 🔥 DIVINE: localStorage as Single Source of Truth
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, error } = useQuery<TwilioStatusResponse>({
    queryKey: ["twilio-settings"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/twilio-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Twilio status");
      }

      return response.json();
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
    staleTime: 0, // 🔥 DIVINE: Always fresh, credentials change frequently
    gcTime: 1000 * 60, // Keep in cache 1 minute only (renamed from cacheTime in React Query v5)
  });

  // 🔥 DIVINE: Helper to invalidate cache after mutations
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
    queryClient.removeQueries({ queryKey: ["twilio-settings"] }); // Force removal
  };

  return {
    hasTwilioCredentials: data?.has_twilio_credentials || false,
    accountSidPreview: data?.account_sid_preview,
    phoneNumber: data?.phone_number,
    isLoading,
    refetch,
    invalidate, // 🔥 DIVINE: Expose invalidate for DELETE operations
    error,
  };
}
