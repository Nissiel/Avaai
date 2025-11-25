"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StudioConfigInput } from "@/lib/validations/config";
import { FlowCanvas } from "./flow-builder/flow-canvas";
import { getStandardScenarioWithConfig } from "./flow-builder/scenarios";
import type { NodeConfig } from "./flow-builder/types";
import { updateStudioConfiguration } from "@/lib/api/studio-orchestrator";
import {
  handleStudioUpdateToasts,
  handleStudioUpdateError,
  showStudioUpdateLoading,
} from "@/lib/toast/studio-update-toasts";
import { toast } from "sonner";

const STUDIO_CONFIG_QUERY_KEY = ["studio-config"] as const;

async function fetchStudioConfig(): Promise<StudioConfigInput> {
  // 🔐 DIVINE: Get token from localStorage for authenticated request
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/config", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? "Failed to load studio configuration");
  }

  return response.json() as Promise<StudioConfigInput>;
}

export function AssistantsStudio() {
  const tHero = useTranslations("assistantsPage.hero");
  const queryClient = useQueryClient();

  const studioConfigQuery = useQuery<StudioConfigInput>({
    queryKey: STUDIO_CONFIG_QUERY_KEY,
    queryFn: fetchStudioConfig,
    staleTime: 60_000,
  });

  // Mutation for updating node configuration
  const updateMutation = useMutation({
    mutationFn: async (values: StudioConfigInput) => {
      return await updateStudioConfiguration(values, { skipVapiSync: false });
    },
    onMutate: () => {
      const toastId = showStudioUpdateLoading();
      return { toastId };
    },
    onSuccess: (result) => {
      // Update React Query cache with DB result
      const savedConfig = result.db.config;
      if (savedConfig) {
        queryClient.setQueryData(STUDIO_CONFIG_QUERY_KEY, savedConfig);
      }

      // Show appropriate toasts
      handleStudioUpdateToasts(result);
    },
    onError: (error) => {
      handleStudioUpdateError(error);
    },
    onSettled: (_result, _error, _variables, context) => {
      if (context?.toastId !== undefined) {
        toast.dismiss(context.toastId);
      }
    },
  });

  const handleNodeConfigUpdate = (nodeId: string, config: NodeConfig) => {
    const currentConfig = studioConfigQuery.data;
    if (!currentConfig) return;

    // Merge node config with current studio config
    const updatedConfig: StudioConfigInput = {
      ...currentConfig,
      systemPrompt: config.systemPrompt || currentConfig.systemPrompt,
      firstMessage: config.firstMessage || currentConfig.firstMessage,
      guidelines: config.guidelines || currentConfig.guidelines,
      voiceProvider: config.voiceProvider || currentConfig.voiceProvider,
      voiceId: config.voiceId || currentConfig.voiceId,
      voiceSpeed: config.voiceSpeed ?? currentConfig.voiceSpeed,
      tone: config.tone || currentConfig.tone,
    };

    // Save to backend
    updateMutation.mutate(updatedConfig);
  };

  // Get scenario with config
  const scenario = studioConfigQuery.data
    ? getStandardScenarioWithConfig(studioConfigQuery.data)
    : null;

  return (
    <section className="space-y-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-brand-500/5 p-8 shadow-elevated">
        <div className="space-y-3 max-w-2xl">
          <Badge variant="brand" className="w-fit gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {tHero("badge")}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Créez votre Assistant IA parfait
          </h1>
        </div>
      </header>

      <div className="space-y-6">
        {studioConfigQuery.isPending && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading flow...</div>
          </div>
        )}

        {studioConfigQuery.isError && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-center">
              <div className="text-destructive font-semibold text-lg">
                Failed to load configuration
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your session may have expired. Please try logging in again.
              </p>
            </div>
            <button
              onClick={() => {
                // Clear expired tokens
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                // Redirect to login
                window.location.href = "/login";
              }}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Log In Again
            </button>
          </div>
        )}

        {scenario && (
          <FlowCanvas
            scenario={scenario}
            onNodeConfigUpdate={handleNodeConfigUpdate}
          />
        )}
      </div>
    </section>
  );
}
