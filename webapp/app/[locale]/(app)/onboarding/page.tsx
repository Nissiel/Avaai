import { redirect } from "next/navigation";

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/onboarding/welcome`);
}
