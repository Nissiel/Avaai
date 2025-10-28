import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/lib/stores/session-store";

interface TwilioStatusResponse {
  has_twilio_credentials: boolean;
  account_sid_preview?: string;
  phone_number?: string;
}

export function useTwilioStatus() {
  const session = useSessionStore((state) => state.session);

  const { data, isLoading, refetch, error } = useQuery<TwilioStatusResponse>({
    queryKey: ["twilio-settings", session?.accessToken],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/twilio-settings`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Twilio status");
      }

      return response.json();
    },
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasTwilioCredentials: data?.has_twilio_credentials || false,
    accountSidPreview: data?.account_sid_preview,
    phoneNumber: data?.phone_number,
    isLoading,
    refetch,
    error,
  };
}
