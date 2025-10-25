import { AppProviders } from "@/providers/app-providers";
import { getCurrentSession } from "@/lib/auth/server";
import { getDirection, isLocale, locales, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) {
    notFound();
  }

  unstable_setRequestLocale(localeParam);

  const messages = (await import(`@/messages/${localeParam}.json`)).default;
  const session = await getCurrentSession();
  const direction = getDirection(localeParam);

  return (
    <NextIntlClientProvider locale={localeParam} messages={messages} timeZone="UTC">
      <AppProviders session={session}>
        <div dir={direction} className="min-h-screen bg-background antialiased">
          {children}
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
