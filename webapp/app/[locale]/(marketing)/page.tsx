import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";

export default function MarketingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  return (
    <>
      <Hero locale={locale} />
      <FeatureGrid locale={locale} />
      <HowItWorks locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
