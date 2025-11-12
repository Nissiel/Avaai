import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";

export default async function MarketingPage({ params }: { params: Promise<{ locale: string }> }) {
  // 🔥 DIVINE FIX: await params in Next.js 15
  const { locale } = await params;
  
  return (
    <>
      <Hero locale={locale} />
      <FeatureGrid locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
