import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : fallbackLocale;
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-4 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {translate(locale, "onboarding.pageTitle", "Ava onboarding" )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {translate(locale, "onboarding.pageSubtitle", "Complete the steps to launch Ava. You can revisit them anytime from Ava Studio.")}
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
