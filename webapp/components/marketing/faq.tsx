import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

interface FaqProps {
  locale: string;
}

export function Faq({ locale: localeParam }: FaqProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const items = [
    {
      question: translate(locale, "marketing.faq.items.1.q", "What makes Ava different from a call bot?"),
      answer: translate(
        locale,
        "marketing.faq.items.1.a",
        "Ava is orchestrated via playbooks, human-in-the-loop guardrails, and realtime transcripts that your team can monitor, edit, or rewind.",
      ),
    },
    {
      question: translate(locale, "marketing.faq.items.2.q", "Do I need Twilio to get started?"),
      answer: translate(
        locale,
        "marketing.faq.items.2.a",
        "No. We provide a sandbox voice stack with WebRTC tests. Connect Twilio, PSTN or SIP when you are production-ready.",
      ),
    },
    {
      question: translate(locale, "marketing.faq.items.3.q", "Is Ava compliant with GDPR and SOC2?"),
      answer: translate(
        locale,
        "marketing.faq.items.3.a",
        "Yes. Data residency, audit logs, signed webhooks, DPA, and GDPR tooling ship by default.",
      ),
    },
    {
      question: translate(locale, "marketing.faq.items.4.q", "Can Ava handle multiple brands or languages?"),
      answer: translate(
        locale,
        "marketing.faq.items.4.a",
        "Multi-tenant support lets each org configure tone, languages (EN/FR/HE) and fallback scripts per brand.",
      ),
    },
  ];

  return (
    <section id="faq" className="border-b border-border/50 bg-background">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-12 px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {translate(locale, "marketing.faq.title", "Questions teams ask before shipping Ava")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {translate(locale, "marketing.faq.subtitle", "Still unsure? Book a walkthrough and we will tailor a plan for your use case.")}
          </p>
        </div>
        <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold tracking-[-0.02em]">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
