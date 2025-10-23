import { z } from "zod";

export const studioConfigSchema = z.object({
  organizationName: z.string().min(1),
  adminEmail: z.string().email(),
  timezone: z.string().min(1),
  language: z.string().min(2),
  persona: z.string().min(1),
  tone: z.string().min(1),
  guidelines: z.string().min(1),
  phoneNumber: z.string().min(4),
  businessHours: z.string().min(4),
  fallbackEmail: z.string().email(),
  summaryEmail: z.string().email(),
  smtpServer: z.string().min(1),
  smtpPort: z.string().min(1),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().min(1),
});

export const studioConfigUpdateSchema = studioConfigSchema.partial();

export type StudioConfigInput = z.infer<typeof studioConfigSchema>;
export type StudioConfigUpdateInput = z.infer<typeof studioConfigUpdateSchema>;
