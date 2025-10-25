import { z } from "zod";

export const studioConfigSchema = z.object({
  // Organization basics
  organizationName: z.string().min(1),
  adminEmail: z.string().email(),
  timezone: z.string().min(1),
  language: z.string().min(2),
  persona: z.string().min(1),
  tone: z.string().min(1),
  guidelines: z.string().default(""),
  phoneNumber: z.string().default(""),
  businessHours: z.string().min(4),
  fallbackEmail: z.string().email(),
  summaryEmail: z.string().email(),
  
  // SMTP (deprecated - keep for backward compat)
  smtpServer: z.string().default(""),
  smtpPort: z.string().default("587"),
  smtpUsername: z.string().default(""),
  smtpPassword: z.string().default(""),
  
  // 🤖 AI Performance
  aiModel: z.string().default("gpt-4"),
  aiTemperature: z.number().min(0).max(1).default(0.5),
  aiMaxTokens: z.number().min(50).max(500).default(150),
  
  // 🎤 Voice Settings
  voiceProvider: z.string().default("11labs"),
  voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  voiceSpeed: z.number().min(0.5).max(2.0).default(1.2),
  
  // 💬 Conversation Behavior
  systemPrompt: z.string().min(10),
  firstMessage: z.string().min(5),
  askForName: z.boolean().default(true),
  askForEmail: z.boolean().default(false),
  askForPhone: z.boolean().default(false),
  
  // 🔗 Vapi Integration
  vapiAssistantId: z.string().nullable().optional(),
});

export const studioConfigUpdateSchema = studioConfigSchema.partial();

export type StudioConfigInput = z.infer<typeof studioConfigSchema>;
export type StudioConfigUpdateInput = z.infer<typeof studioConfigUpdateSchema>;

export function createStudioConfigSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  const required = t("errors.required");
  const invalidEmail = t("errors.email");

  return z.object({
    // Organization basics
    organizationName: z.string().min(1, required),
    adminEmail: z.string().email(invalidEmail),
    timezone: z.string().min(1, required),
    language: z.string().min(2, required),
    persona: z.string().min(1, required),
    tone: z.string().min(1, required),
    guidelines: z.string().default(""),
    phoneNumber: z.string().default(""),
    businessHours: z.string().min(4, required),
    fallbackEmail: z.string().email(invalidEmail),
    summaryEmail: z.string().email(invalidEmail),
    
    // SMTP (deprecated - optional now)
    smtpServer: z.string().default(""),
    smtpPort: z.string().default("587"),
    smtpUsername: z.string().default(""),
    smtpPassword: z.string().default(""),
    
    // 🤖 AI Performance
    aiModel: z.string().default("gpt-4"),
    aiTemperature: z.number().min(0).max(1).default(0.5),
    aiMaxTokens: z.number().min(50).max(500).default(150),
    
    // 🎤 Voice Settings
    voiceProvider: z.string().default("11labs"),
    voiceId: z.string().default("21m00Tcm4TlvDq8ikWAM"),
    voiceSpeed: z.number().min(0.5).max(2.0).default(1.2),
    
    // 💬 Conversation Behavior
    systemPrompt: z.string().min(10, required),
    firstMessage: z.string().min(5, required),
    askForName: z.boolean().default(true),
    askForEmail: z.boolean().default(false),
    askForPhone: z.boolean().default(false),
    
    // 🔗 Vapi Integration
    vapiAssistantId: z.string().nullable().optional(),
  });
}
