import { z } from "zod";

export const AvaProfileSchema = z.object({
  name: z.string().min(2).max(40),
  voice: z.string().min(2).max(64),
  language: z.enum(["fr-FR", "fr-CA", "en-GB", "en-US"]),
  tone: z.string().max(120),
  personality: z.string().max(160),
  greeting: z.string().min(8).max(200),
  allowed_topics: z.array(z.string().min(2).max(80)).min(1),
  forbidden_topics: z.array(z.string().min(2).max(80)).optional().default([]),
  can_take_notes: z.boolean(),
  can_summarize_live: z.boolean(),
  fallback_behavior: z.string().max(200),
  signature_style: z.string().max(140),
  custom_rules: z.string().max(1000),
});

export type AvaProfileFormValues = z.infer<typeof AvaProfileSchema>;
