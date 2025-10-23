import { z } from "zod";

const voiceObjectSchema = z.object({
  provider: z.enum(["playht", "azure"]),
  voiceId: z.string().min(1),
});

const voiceSchema = z.union([voiceObjectSchema, z.string().min(1)]).transform((value) => {
  if (typeof value === "string") {
    return {
      provider: value.startsWith("fr-") ? "azure" : "playht",
      voiceId: value,
    } as const;
  }

  return value;
});

const modelSchema = z
  .object({
    provider: z.enum(["openai"]),
    model: z.enum(["gpt-4", "gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"]),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(32).max(4000).optional(),
  })
  .default({ provider: "openai", model: "gpt-4o-mini" });

const functionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional(),
  }),
  url: z.string().url().optional(),
});

export const createAssistantSchema = z.object({
  name: z.string().min(2).max(60),
  instructions: z.string().min(10).max(20_000),
  phoneNumber: z.string().min(4).max(32),
  firstMessage: z
    .string()
    .min(4)
    .max(360)
    .default("Bonjour, je suis Ava. Comment puis-je vous aider ?"),
  voice: voiceSchema,
  model: modelSchema.optional(),
  functions: z.array(functionSchema).optional(),
  metadata: z
    .object({
      personality: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

export type CreateAssistantInput = z.infer<typeof createAssistantSchema>;
export type AssistantVoiceInput = z.infer<typeof voiceObjectSchema>;

export const updateAssistantSchema = createAssistantSchema
  .partial()
  .extend({
    id: z.string().min(1),
  })
  .transform((value) => ({
    ...value,
    voice: value.voice ?? undefined,
  }));

export type UpdateAssistantInput = z.infer<typeof updateAssistantSchema>;
