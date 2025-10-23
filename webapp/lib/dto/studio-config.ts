export interface StudioConfig {
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
}

export type StudioConfigUpdate = Partial<StudioConfig>;
