import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import he from "@/messages/he.json";
import type { Locale } from "@/lib/i18n/locales";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en,
  fr,
  he,
};

export function translate(locale: Locale, key: string, fallback?: string): string {
  const segments = key.split(".");
  let value: unknown = dictionaries[locale] ?? dictionaries.en;
  for (const segment of segments) {
    if (value && typeof value === "object" && segment in value) {
      value = (value as Record<string, unknown>)[segment];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value === "string") {
    return value;
  }

  return fallback ?? key;
}
