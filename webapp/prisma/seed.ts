// @ts-nocheck
import { PrismaClient, IntegrationStatus, IntegrationKind, PlanTier, SubStatus, Provider, CallOutcome, OrgRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.upsert({
    where: { slug: "lex-law" },
    update: {},
    create: {
      name: "Lex & Co. Law",
      slug: "lex-law",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "sophie@lexandco.com" },
    update: {},
    create: {
      email: "sophie@lexandco.com",
      name: "Sophie Martin",
      locale: "fr",
      twoFAEnabled: true,
    },
  });

  await prisma.orgUser.upsert({
    where: { orgId_userId: { orgId: org.id, userId: owner.id } },
    update: { role: OrgRole.OWNER },
    create: {
      orgId: org.id,
      userId: owner.id,
      role: OrgRole.OWNER,
    },
  });

  const ava = await prisma.ava.upsert({
    where: { orgId_name: { orgId: org.id, name: "Ava" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Ava",
      locales: ["en", "fr"],
      persona: "Concierge",
      style: {
        tone: "warm",
        autonomy: "high",
        guardrails: ["Escalate emergencies", "Capture contact details"],
      },
      voice: "ava-warm",
      prompts: {
        system: "You are Ava, the AI concierge for Lex & Co.",
        guardrails: "Always collect name, email, phone, reason before closing.",
      },
      rules: {
        forbiddenPhrases: ["I am a bot"],
        escalation: ["urgent", "legal emergency"],
      },
      integrations: {
        calendar: "google",
        crm: "hubspot",
      },
    },
  });

  const number = await prisma.phoneNumber.upsert({
    where: { e164: "+16285550195" },
    update: {},
    create: {
      orgId: org.id,
      provider: Provider.TWILIO,
      e164: "+16285550195",
      routing: {
        profile: "Concierge daytime",
        fallbackEmail: "ops@lexandco.com",
      },
      businessHours: {
        timezone: "Europe/Paris",
        hours: "Mon-Fri · 09:00-18:00",
      },
      voicemail: {
        prompt: "Thank you for calling Lex & Co. Leave your name and number.",
      },
    },
  });

  await prisma.integration.upsert({
    where: { orgId_kind: { orgId: org.id, kind: IntegrationKind.GOOGLE_CALENDAR } },
    update: { status: IntegrationStatus.CONNECTED },
    create: {
      orgId: org.id,
      kind: IntegrationKind.GOOGLE_CALENDAR,
      config: { account: "calendar@lexandco.com" },
      status: IntegrationStatus.CONNECTED,
    },
  });

  await prisma.planSubscription.upsert({
    where: { orgId: org.id },
    update: {
      plan: PlanTier.PRO,
      status: SubStatus.ACTIVE,
      usage: { minutesUsed: 1420, minutesAllocated: 1800 },
    },
    create: {
      orgId: org.id,
      stripeCustomerId: "cus_demo123",
      stripeSubId: "sub_demo123",
      plan: PlanTier.PRO,
      status: SubStatus.ACTIVE,
      usage: { minutesUsed: 1420, minutesAllocated: 1800 },
      renewsAt: new Date("2024-07-01T00:00:00Z"),
    },
  });

  const call = await prisma.call.create({
    data: {
      orgId: org.id,
      avaId: ava.id,
      numberId: number.id,
      from: "+14155550101",
      to: number.e164,
      startedAt: new Date("2024-06-18T09:45:00Z"),
      endedAt: new Date("2024-06-18T09:51:12Z"),
      transcript: {
        caller: [
          "Hi Ava, I'm calling to confirm the appointment.",
          "Wednesday afternoon works best for me.",
        ],
        ava: [
          "Hello Camila, happy to help.",
          "Great, Wednesday 14:15 is confirmed. You'll receive an email recap shortly.",
        ],
      },
      summary: "Booked follow-up consultation and sent recap email.",
      recordingUrl: "https://cdn.example.com/calls/call_01.mp3",
      outcome: CallOutcome.ANSWERED,
      tags: ["booking", "high-intent"],
    },
  });

  console.log(`Seeded org ${org.name} with call ${call.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
