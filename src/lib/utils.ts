import { DEFAULT_LOCALE, intlLocale, type Locale } from "./i18n/config";
import type { TFn } from "./i18n/translate";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Great-circle distance between two coordinates, in kilometers. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number, t: TFn): string {
  if (km < 1) return t("common.distanceM", { n: Math.round(km * 1000) });
  return t("common.distanceKm", { n: km.toFixed(1) });
}

export function formatDT(amount: number, locale: Locale = DEFAULT_LOCALE): string {
  return `${amount.toLocaleString(intlLocale(locale))} ${locale === "ar" ? "د.ت" : "DT"}`;
}

export function formatDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return new Date(iso).toLocaleTimeString(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return `${formatDate(iso, locale)} · ${formatTime(iso, locale)}`;
}

export function formatRelativeTime(iso: string, t: TFn, locale: Locale = DEFAULT_LOCALE): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return t("common.justNow");
  if (diffMin < 60) return t("common.minAgo", { n: diffMin });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return t("common.hourAgo", { n: diffHr });
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return t("common.dayAgo", { n: diffDay });
  return formatDate(iso, locale);
}

/** Parses a JSON-encoded string[] column, tolerating null/empty/garbage. */
export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toStringArray(value: string[]): string {
  return JSON.stringify(value);
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}