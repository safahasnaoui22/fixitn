import type { Locale } from "./config";
import fr from "./messages/fr.json";
import en from "./messages/en.json";
import ar from "./messages/ar.json";
// One catalog file per area of the app: { "fr": {...}, "en": {...}, "ar": {...} }
import common from "./messages/areas/common.json";
import adminCore from "./messages/areas/admin-core.json";
import adminOps from "./messages/areas/admin-ops.json";
import adminSupport from "./messages/areas/admin-support.json";
import client from "./messages/areas/client.json";
import auth from "./messages/areas/auth.json";
import booking from "./messages/areas/booking.json";
import tech from "./messages/areas/tech.json";
import components from "./messages/areas/components.json";
import system from "./messages/areas/system.json";

export type Messages = Record<string, string>;
type AreaFile = Record<Locale, Messages>;

const AREAS: AreaFile[] = [
  common, adminCore, adminOps, adminSupport, client, booking, auth, tech, components, system,
] as AreaFile[];

function merge(locale: Locale, base: Messages): Messages {
  const out: Messages = { ...base };
  for (const area of AREAS) Object.assign(out, area[locale]);
  return out;
}

const FR = merge("fr", fr);
const ALL: Record<Locale, Messages> = {
  fr: FR,
  en: merge("en", en),
  ar: merge("ar", ar),
};

export function getMessages(locale: Locale): Messages {
  return ALL[locale];
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Build a translate function. Missing key in the chosen language →
 * falls back to French (the source) → then to the key itself.
 * Variables: t(key, { name })  with  "Bonjour {name}".
 */
export function makeT(messages: Messages): TFn {
  return function t(key, vars) {
    let s = messages[key] ?? FR[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
}

/** "Up to 5 requests / month!" → "up_to_5_requests_month" (stable key for DB-stored free text). */
export function slugKey(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Translate text that is stored in the database (category names, plan features,
 * badges…). If the catalog has `${prefix}.${slugKey(raw)}` use it, otherwise show
 * the stored text unchanged (so admin-typed custom text never disappears).
 *   tDb(t, "planFeature", "Unlimited requests")
 */
export function tDb(t: TFn, prefix: string, raw: string | null | undefined): string {
  if (!raw) return "";
  const key = `${prefix}.${slugKey(raw)}`;
  const out = t(key);
  return out === key ? raw : out;
}

/** Same as tDb but the key is given explicitly (e.g. category by slug). */
export function tOr(t: TFn, key: string, fallback: string): string {
  const out = t(key);
  return out === key ? fallback : out;
}

/**
 * Text that is STORED (notification title/body, automatic chat messages…) is saved as a
 * token instead of a sentence, and translated when it is DISPLAYED, in the viewer's language:
 *   title: i18nText("client.notif.accepted.title")
 *   body:  i18nText("client.notif.accepted.body", { name: tech.fullName })
 *   …then in the UI:  renderText(t, n.title)
 * Old rows (plain sentences saved before this existed) are shown unchanged.
 */
export function i18nText(key: string, vars?: Record<string, string | number>): string {
  return "i18n:" + JSON.stringify(vars ? { k: key, v: vars } : { k: key });
}

export function renderText(t: TFn, stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith("i18n:")) return stored;
  try {
    const { k, v } = JSON.parse(stored.slice(5)) as { k: string; v?: Record<string, string | number> };
    return t(k, v);
  } catch {
    return stored;
  }
}
