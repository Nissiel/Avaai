export interface StudioConfig {
  // Organization settings
  organizationName: string;
  adminEmail: string;
  timezone: string;
  language: string;
  persona: string;
  tone: string;
  guidelines: string;
  phoneNumber: string;
  businessHours: string;
  fallbackEmail: string;
  summaryEmail: string;
  smtpServer: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  
  // 🎯 AI Performance settings
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  
  // 🎤 Voice settings
  voiceProvider: string;
  voiceId: string;
  voiceSpeed: number;
  
  // 🎧 Transcriber settings (Speech-to-Text)
  transcriberProvider: string;
  transcriberModel: string;
  transcriberLanguage: string;
  
  // 📝 Conversation behavior
  systemPrompt: string;
  firstMessage: string;
  askForName: boolean;
  askForEmail: boolean;
  askForPhone: boolean;
  
  // 🎯 Vapi Assistant ID (for sync)
  vapiAssistantId: string | null;
}

export type StudioConfigUpdate = Partial<StudioConfig>;

