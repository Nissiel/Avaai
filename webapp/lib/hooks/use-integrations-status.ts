import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { getVapiSettings } from "@/lib/api/vapi-settings";
import { getTwilioSettings } from "@/lib/api/twilio-settings";

interface IntegrationsStatus {
  vapi: {
    configured: boolean;
    keyPreview?: string | null;
  };
  twilio: {
    configured: boolean;
    phoneNumber?: string;
    accountSidPreview?: string | null;
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
      const [vapiData, twilioData] = await Promise.all([
        getVapiSettings().catch(() => ({ has_vapi_key: false, vapi_api_key_preview: null })),
        getTwilioSettings().catch(() => null),
      ]);

      return {
        vapi: {
          configured: vapiData?.has_vapi_key ?? false,
          keyPreview: vapiData?.vapi_api_key_preview ?? null,
        },
        twilio: {
          configured: twilioData?.configured ?? false,
          phoneNumber: twilioData?.phoneNumber ?? undefined,
          accountSidPreview: twilioData?.accountSidPreview ?? null,
        },
      };
    },
    enabled: !!token, // 🔥 DIVINE: Only run if token exists (no race condition!)
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // 🔥 DIVINE: Only 1 retry to avoid long waits
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
  };

  return {
    vapi: data?.vapi ?? { configured: false },
    twilio: data?.twilio ?? { configured: false },
    integrations: data,
    isLoading,
    refetch,
    invalidate,
  };
}
