import { redirect } from 'next/navigation';

interface OnboardingPageProps {
  params: {
    locale: string;
  };
}

export default function OnboardingPage({ params }: OnboardingPageProps) {
  // Redirect to first step with locale
  redirect(`/${params.locale}/onboarding/welcome`);
}
