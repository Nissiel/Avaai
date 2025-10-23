export const VOICE_TONES = ["warm", "professional", "energetic"] as const;
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", voice: "Ava Warm" },
  { code: "fr", label: "Français", voice: "Ava Clair" },
  { code: "he", label: "עברית", voice: "Ava Or" }
];

export const PLAN_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    description: "Test Ava with 60 minutes of calls per month",
    features: [
      "1 workspace",
      "60 call minutes",
      "Email summaries",
      "Basic integrations"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    currency: "USD",
    description: "Scale to a full AI receptionist with automation",
    features: [
      "Unlimited inbound numbers",
      "Realtime call monitoring",
      "Calendar + CRM sync",
      "Priority support"
    ]
  },
  {
    id: "business",
    name: "Business",
    price: 499,
    currency: "USD",
    description: "Advanced compliance, routing and analytics",
    features: [
      "Multi-org management",
      "Advanced analytics",
      "Dedicated CSM",
      "Custom voice cloning"
    ]
  }
];

export const SUPPORTED_INTEGRATIONS = [
  "twilio",
  "google-calendar",
  "outlook",
  "gmail",
  "notion",
  "slack",
  "hubspot",
  "zapier",
  "webhook"
] as const;

export const CALL_OUTCOMES = ["answered", "missed", "voicemail", "callback"] as const;

export const FEATURE_FLAGS = {
  enableInProductTours: true,
  enableAvaSnapshots: true,
  enableRealtimeQA: false
};
