import { z } from "zod";

export const onboardingProfileSchema = z.object({
  name: z.string().min(2),
  // ✨ DIVINE: Email removed - captured during signup, available in session
  timezone: z.string(),
  locale: z.enum(["en", "fr", "he"]),
  marketingOptIn: z.boolean().optional(),
  acceptTerms: z.literal(true),
});

export const onboardingAvaSchema = z.object({
  persona: z.enum(["secretary", "concierge", "sdr", "cs"]),
  jobToBeDone: z.string().min(4),
  languages: z.array(z.enum(["en", "fr", "he"])).min(1),
  tone: z.enum(["warm", "professional", "energetic"]),
  guidelines: z.string().min(10),
});

export const onboardingTelephonySchema = z.object({
  strategy: z.enum(["attach", "purchase"]),
  number: z.string().optional(),
  businessHours: z.string().min(3),
  fallbackEmail: z.string().email().optional(),
});

export const onboardingIntegrationsSchema = z.object({
  calendar: z.enum(["google", "outlook", "none"]),
  workspaceApps: z.array(z.string()).optional(),
  crm: z.enum(["hubspot", "salesforce", "none"]).optional(),
});

export const onboardingPlanSchema = z.object({
  plan: z.enum(["free", "pro", "business"]),
  seats: z.number().min(1).max(50),
});

export const onboardingSchema = onboardingProfileSchema
  .merge(onboardingAvaSchema)
  .merge(onboardingTelephonySchema)
  .merge(onboardingIntegrationsSchema)
  .merge(onboardingPlanSchema);

export type OnboardingProfileValues = z.infer<typeof onboardingProfileSchema>;
export type OnboardingAvaValues = z.infer<typeof onboardingAvaSchema>;
export type OnboardingTelephonyValues = z.infer<typeof onboardingTelephonySchema>;
export type OnboardingIntegrationsValues = z.infer<typeof onboardingIntegrationsSchema>;
export type OnboardingPlanValues = z.infer<typeof onboardingPlanSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
