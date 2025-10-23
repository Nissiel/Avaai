import { type OrgOption } from "@/components/navigation/org-switcher";
import { PLAN_TIERS } from "@/lib/constants";

export const demoOrganizations: OrgOption[] = [
  {
    id: "org_demo_law",
    name: "Lex & Co. Law",
    slug: "lex-law",
    plan: "pro",
  },
  {
    id: "org_demo_clinic",
    name: "Nova Clinic",
    slug: "nova-clinic",
    plan: "business",
  },
  {
    id: "org_demo_startup",
    name: "Orbit Ventures",
    slug: "orbit-ventures",
    plan: "free",
  },
];

export function getPlanById(planId: OrgOption["plan"]) {
  return PLAN_TIERS.find((plan) => plan.id === planId);
}

export const demoMetrics = {
  csat: 92,
  callsAnswered: 318,
  callsMissed: 12,
  meetingsBooked: 47,
  avgHandleTime: "02:34",
  firstResponse: "00:23",
  smsFollowUps: 68,
  emailSummaries: 112,
};

export interface DemoCall {
  id: string;
  contact: string;
  direction: "inbound" | "outbound";
  outcome: "answered" | "missed" | "voicemail" | "callback";
  timestamp: string;
  summary: string;
  tags: string[];
  duration: string;
}

export const demoCalls: DemoCall[] = [
  {
    id: "call_01",
    contact: "Camila Ortiz",
    direction: "inbound",
    outcome: "answered",
    timestamp: "2024-06-18T09:45:00Z",
    summary: "Booked follow-up for dental consultation. Sent recap email.",
    tags: ["booking", "high-intent"],
    duration: "06:12",
  },
  {
    id: "call_02",
    contact: "Rohan Patel",
    direction: "outbound",
    outcome: "voicemail",
    timestamp: "2024-06-18T08:12:00Z",
    summary: "Left voicemail to confirm inspection slot. SMS reminder scheduled.",
    tags: ["follow-up"],
    duration: "01:03",
  },
  {
    id: "call_03",
    contact: "Sarah Chen",
    direction: "inbound",
    outcome: "answered",
    timestamp: "2024-06-17T16:24:00Z",
    summary: "Qualified lead for enterprise demo. Routed to AE team.",
    tags: ["enterprise", "handover"],
    duration: "08:44",
  },
  {
    id: "call_04",
    contact: "Omar Haddad",
    direction: "inbound",
    outcome: "missed",
    timestamp: "2024-06-17T13:02:00Z",
    summary: "Call missed outside business hours. Escalation email sent.",
    tags: ["after-hours"],
    duration: "00:00",
  },
];

export interface DemoIntegration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "action_required" | "not_connected";
  category: "telephony" | "productivity" | "crm" | "automation";
}

export const demoIntegrations: DemoIntegration[] = [
  {
    id: "twilio",
    name: "Twilio Voice",
    description: "Purchase numbers, connect SIP, enable call recording.",
    status: "connected",
    category: "telephony",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Real-time availability sync for meeting scheduling.",
    status: "connected",
    category: "productivity",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send missed call alerts and summaries to channels.",
    status: "action_required",
    category: "productivity",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Create deals and log calls automatically.",
    status: "connected",
    category: "crm",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync call recaps to shared workspace pages.",
    status: "not_connected",
    category: "productivity",
  },
];

export interface DemoInboxItem {
  id: string;
  type: "call" | "email" | "task";
  title: string;
  dueAt?: string;
  assignee: string;
  status: "open" | "in_progress" | "completed";
  description: string;
}

export const demoInbox: DemoInboxItem[] = [
  {
    id: "task_01",
    type: "call",
    title: "Review transcript – Camila Ortiz",
    dueAt: "2024-06-18T12:00:00Z",
    assignee: "You",
    status: "open",
    description: "Confirm dietary restrictions before tomorrow's consultation.",
  },
  {
    id: "task_02",
    type: "email",
    title: "Send recap to Rohan Patel",
    assignee: "Sophie",
    status: "in_progress",
    description: "Include inspection checklist and reschedule link.",
  },
  {
    id: "task_03",
    type: "task",
    title: "Enable call whisper for SDRs",
    assignee: "Ops",
    status: "completed",
    description: "Configure coaching mode in Ava Studio.",
  },
];

export interface DemoTimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

export const demoTimeline: DemoTimelineItem[] = [
  {
    id: "event_01",
    title: "Twilio number provisioned",
    description: "Purchased +1 (628) 555‑0195 for inbound concierge line.",
    timestamp: "2024-06-17T10:22:00Z",
  },
  {
    id: "event_02",
    title: "HubSpot integration synced",
    description: "Deals auto-created for inbound demo requests.",
    timestamp: "2024-06-17T11:55:00Z",
  },
  {
    id: "event_03",
    title: "Ava playbook published",
    description: "Loaded Concierge v2 with escalation guardrails.",
    timestamp: "2024-06-18T08:14:00Z",
  },
];

export interface DemoScheduleSlot {
  id: string;
  title: string;
  organizer: string;
  attendees: string[];
  start: string;
  end: string;
  channel: "voice" | "video" | "in-person";
}

export const demoSchedule: DemoScheduleSlot[] = [
  {
    id: "slot_01",
    title: "Discovery call – Bloom Labs",
    organizer: "Ava",
    attendees: ["maria@bloomlabs.com", "alex@lexandco.com"],
    start: "2024-06-19T09:30:00Z",
    end: "2024-06-19T10:00:00Z",
    channel: "video",
  },
  {
    id: "slot_02",
    title: "Property inspection follow-up",
    organizer: "Ava",
    attendees: ["rohan@novaclinic.com", "ops@lexandco.com"],
    start: "2024-06-19T13:00:00Z",
    end: "2024-06-19T13:30:00Z",
    channel: "voice",
  },
  {
    id: "slot_03",
    title: "VIP concierge briefing",
    organizer: "Sophie Martin",
    attendees: ["ava@lexandco.com"],
    start: "2024-06-20T16:00:00Z",
    end: "2024-06-20T16:30:00Z",
    channel: "in-person",
  },
  {
    id: "slot_04",
    title: "Quarterly ops sync",
    organizer: "Operations",
    attendees: ["ava@lexandco.com", "ops@lexandco.com"],
    start: "2024-06-21T11:00:00Z",
    end: "2024-06-21T11:45:00Z",
    channel: "video",
  },
];

export interface DemoNumber {
  id: string;
  country: string;
  formatted: string;
  status: "active" | "pending" | "disabled";
  routingProfile: string;
}

export const demoNumbers: DemoNumber[] = [
  {
    id: "num_01",
    country: "US",
    formatted: "+1 (628) 555-0195",
    status: "active",
    routingProfile: "Concierge daytime",
  },
  {
    id: "num_02",
    country: "FR",
    formatted: "+33 1 86 95 45 20",
    status: "active",
    routingProfile: "Bilingual support",
  },
  {
    id: "num_03",
    country: "IL",
    formatted: "+972 3-374-0195",
    status: "pending",
    routingProfile: "A/B testing",
  },
];

export interface BillingUsage {
  minutesUsed: number;
  minutesAllocated: number;
  smsUsed: number;
  smsAllocated: number;
  overages: number;
  nextInvoice: string;
}

export const demoBillingUsage: BillingUsage = {
  minutesUsed: 1420,
  minutesAllocated: 1800,
  smsUsed: 320,
  smsAllocated: 500,
  overages: 38,
  nextInvoice: "2024-07-01",
};

export interface DemoLogEvent {
  id: string;
  level: "info" | "warning" | "error";
  source: string;
  message: string;
  timestamp: string;
}

export const demoLogs: DemoLogEvent[] = [
  {
    id: "log_01",
    level: "info",
    source: "twilio.webhook",
    message: "Inbound call connected · +1 415 555 0101",
    timestamp: "2024-06-18T09:45:12Z",
  },
  {
    id: "log_02",
    level: "warning",
    source: "ava.guardrails",
    message: "Escalation triggered – keyword 'urgent surgery'",
    timestamp: "2024-06-18T09:47:03Z",
  },
  {
    id: "log_03",
    level: "info",
    source: "resend.email",
    message: "Summary email queued for Camila Ortiz",
    timestamp: "2024-06-18T09:49:55Z",
  },
  {
    id: "log_04",
    level: "error",
    source: "integration.slack",
    message: "Channel webhook returned 403 – invalid token",
    timestamp: "2024-06-18T10:14:21Z",
  },
];

export interface DemoTeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  status: "active" | "pending";
  lastActive: string;
}

export const demoTeam: DemoTeamMember[] = [
  {
    id: "user_01",
    name: "Sophie Martin",
    email: "sophie@lexandco.com",
    role: "Owner",
    status: "active",
    lastActive: "2024-06-18T08:15:00Z",
  },
  {
    id: "user_02",
    name: "Alex Chen",
    email: "alex@lexandco.com",
    role: "Admin",
    status: "active",
    lastActive: "2024-06-18T09:02:00Z",
  },
  {
    id: "user_03",
    name: "Maya Cohen",
    email: "maya@lexandco.com",
    role: "Member",
    status: "pending",
    lastActive: "2024-06-15T12:45:00Z",
  },
];

export interface DemoBillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
}

export const demoBillingPlans: DemoBillingPlan[] = PLAN_TIERS;

export interface DemoSettingToggle {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const demoSecurityToggles: DemoSettingToggle[] = [
  {
    id: "totp",
    title: "2FA required for admins",
    description: "Enforce TOTP during sign-in for all admin roles.",
    enabled: true,
  },
  {
    id: "ip_allow",
    title: "IP allow list",
    description: "Restrict access to office and VPN ranges.",
    enabled: false,
  },
  {
    id: "session_timeout",
    title: "Session timeout",
    description: "Expire inactive sessions after 30 minutes.",
    enabled: true,
  },
];

export const demoAuditExports = [
  {
    id: "export_01",
    createdAt: "2024-06-12T09:00:00Z",
    status: "ready",
    size: "12.4 MB",
  },
  {
    id: "export_02",
    createdAt: "2024-05-30T17:20:00Z",
    status: "expired",
    size: "8.1 MB",
  },
];
