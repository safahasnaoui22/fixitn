import type { Locale } from "./config";
import fr from "./messages/fr.json";
import en from "./messages/en.json";
import ar from "./messages/ar.json";

export type Messages = Record<string, string>;

const ALL: Record<Locale, Messages> = { fr, en, ar };

export function getMessages(locale: Locale): Messages {
  return ALL[locale];
}

/**
 * Build a translate function. Missing key in the chosen language →
 * falls back to French (the source) → then to the key itself.
 * Variables: t("home.hello", { name: "Safa" })  with  "Bonjour {name}".
 */
export function makeT(messages: Messages) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    let s = messages[key] ?? (fr as Messages)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
}
