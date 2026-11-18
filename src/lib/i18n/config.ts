export const LOCALES = ["fr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "fixili_lang";

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ar: "عربي",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** BCP-47 tag for Intl / toLocale*String. Arabic keeps Latin digits (usual in Tunisia). */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-TN-u-nu-latn" : locale === "en" ? "en-GB" : "fr-FR";
}
