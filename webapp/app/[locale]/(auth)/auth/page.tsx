import { SignInForm } from "@/components/auth/sign-in-form";
import { Link } from "@/lib/i18n/routing";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  
  return (
    <div className="space-y-6">
      <SignInForm />
      <p className="text-center text-xs text-muted-foreground">
        {translate(locale, "auth.policy", "By continuing you agree to the Terms and Privacy of Ava.ai.")}{" "}
        <Link href={{ pathname: "/privacy" }} className="underline">
          {translate(locale, "marketing.privacy", "Privacy")}
        </Link>{" · "}
        <Link href={{ pathname: "/terms" }} className="underline">
          {translate(locale, "marketing.terms", "Terms")}
        </Link>
      </p>
    </div>
  );
}
