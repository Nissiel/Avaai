import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { getVapiSettings } from "@/lib/api/vapi-settings";
import { getTwilioSettings } from "@/lib/api/twilio-settings";

interface IntegrationsStatus {
  vapi: {
    configured: boolean;
  };
  twilio: {
    configured: boolean;
    phoneNumber?: string;
  };
}

/**
 * 🔥 DIVINE: Hook to check status of all integrations (Vapi + Twilio)
 * Uses centralized APIs with retry + token refresh built-in
 */
export function useIntegrationsStatus() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<IntegrationsStatus>({
    queryKey: ["integrations-status"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      // 🔥 DIVINE: Use centralized APIs (parallel execution, automatic retry)
      const [vapiResponse, twilioResponse] = await Promise.all([
        getVapiSettings().catch(() => ({ settings: { configured: false, api_key_set: false } })),
        getTwilioSettings().catch(() => ({ settings: { configured: false, account_sid_set: false, auth_token_set: false, phone_number: undefined } })),
      ]);

      return {
        vapi: {
          configured: vapiResponse.settings.configured,
        },
        twilio: {
          configured: twilioResponse.settings.configured,
          phoneNumber: twilioResponse.settings.phone_number,
        },
      };
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
  };

  return {
    vapi: data?.vapi || { configured: false },
    twilio: data?.twilio || { configured: false },
    integrations: data, // 🔥 DIVINE: Expose full data for flexibility
    isLoading,
    refetch,
    invalidate,
  };
}
