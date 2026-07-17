export const locales = ["tr", "en", "de", "fr", "es", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const rtlLocales: readonly Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
