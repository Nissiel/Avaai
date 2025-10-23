export const locales = ["en", "fr", "he"] as const;

export type Locale = (typeof locales)[number];

export const fallbackLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  he: "עברית",
};

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  he: "rtl",
};

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function getDirection(locale: Locale) {
  return localeDirections[locale] ?? "ltr";
}
