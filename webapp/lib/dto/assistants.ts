import type { z } from "zod";

import { createAssistantSchema, updateAssistantSchema } from "@/lib/validations/assistants";

export type CreateAssistantPayload = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantPayload = z.infer<typeof updateAssistantSchema>;

export type AssistantIdentifier = {
  id: string;
};

export type AssistantSummary = AssistantIdentifier & {
  name: string;
  phoneNumber?: string;
  createdAt?: string;
  voice?: {
    provider: "playht" | "azure";
    voiceId: string;
  };
};

export interface AssistantFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  url?: string;
}

export type AssistantModelConfig = {
  provider: "openai";
  model: "gpt-4" | "gpt-3.5-turbo" | "gpt-4o" | "gpt-4o-mini";
  temperature?: number;
  maxTokens?: number;
};

export interface AssistantDetail extends AssistantSummary {
  instructions?: string;
  systemPrompt?: string;
  firstMessage?: string;
  functions?: AssistantFunctionDefinition[];
  metadata?: Record<string, unknown>;
  model?: AssistantModelConfig;
}

export interface AssistantListResponse {
  success: boolean;
  assistants: AssistantSummary[];
}

export interface AssistantResponse {
  success: boolean;
  assistant: AssistantSummary;
}

export interface AssistantDetailResponse {
  success: boolean;
  assistant: AssistantDetail;
}
