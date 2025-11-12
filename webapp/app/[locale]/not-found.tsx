import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";

interface NotFoundProps {
  params: Promise<{ locale: string }>;
}

export default async function NotFound({ params }: NotFoundProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">{translate(locale, "errors.404.title", "Page not found")}</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {translate(locale, "errors.404.description", "The page you are looking for has moved or no longer exists.")}
        </p>
      </div>
      <Button asChild size="lg">
        <Link href={`/${locale}`}>{translate(locale, "errors.404.cta", "Back to home")}</Link>
      </Button>
    </div>
  );
}
