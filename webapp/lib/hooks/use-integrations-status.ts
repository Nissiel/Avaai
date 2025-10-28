import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/lib/stores/session-store";

interface IntegrationsStatus {
  vapi: {
    configured: boolean;
    keyPreview?: string;
  };
  twilio: {
    configured: boolean;
    accountSidPreview?: string;
    phoneNumber?: string;
  };
}

/**
 * Hook to check status of all integrations (Vapi + Twilio)
 * Cached for onboarding performance
 */
export function useIntegrationsStatus() {
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<IntegrationsStatus>({
    queryKey: ["integrations-status", session?.accessToken],
    queryFn: async () => {
      const [vapiResponse, twilioResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/twilio-settings`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }),
      ]);

      const [vapiData, twilioData] = await Promise.all([
        vapiResponse.json(),
        twilioResponse.json(),
      ]);

      return {
        vapi: {
          configured: vapiData.has_vapi_key || false,
          keyPreview: vapiData.vapi_key_preview,
        },
        twilio: {
          configured: twilioData.has_twilio_credentials || false,
          accountSidPreview: twilioData.account_sid_preview,
          phoneNumber: twilioData.phone_number,
        },
      };
    },
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
  };

  return {
    vapi: data?.vapi || { configured: false },
    twilio: data?.twilio || { configured: false },
    isLoading,
    refetch,
    invalidate,
  };
}
