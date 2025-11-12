import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSessionStore } from "@/stores/session-store";
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
 */
export function useIntegrationsStatus() {
  const token = useAuthToken();
  const userId = useSessionStore((state) => state.session?.user?.id ?? null);
  const queryClient = useQueryClient();
  const identityKey = useMemo(() => {
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
  }, [token, userId]);

  const query = useQuery<IntegrationsStatus>({
    queryKey: ["integrations-status", identityKey],
    queryFn: async () => {
      if (!token) {
        throw new Error("No access token");
      }

      const [vapiData, twilioData] = await Promise.all([
        getVapiSettings(),
        getTwilioSettings(),
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
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
  };

  return {
    vapi: query.data?.vapi ?? { configured: false },
    twilio: query.data?.twilio ?? { configured: false },
    integrations: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
