import Link from "next/link";
import { ShieldAlert, ScanFace, Smartphone, LogOut, KeyRound, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  SECURITY_TYPES,
  listAccountsForSecurity,
  listSecurityEvents,
  securitySummary24h,
  type SecurityType,
} from "@/lib/db/security";
import { ResetFaceButton } from "@/components/ResetFaceButton";
import { formatDate, formatTime } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { tOr } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

const TONE: Record<SecurityType, string> = {
  FACE_FAIL: "bg-amber-50 text-amber-700",
  FACE_SHARED: "bg-red-50 text-red-700",
  NEW_DEVICE: "bg-blue-50 text-blue-700",
  FORCED_LOGOUT: "bg-purple-50 text-purple-700",
  FACE_RESET: "bg-surface-alt text-ink",
  LOGIN_FAIL: "bg-amber-50 text-amber-700",
};

const ICON: Record<SecurityType, typeof ShieldAlert> = {
  FACE_FAIL: ScanFace,
  FACE_SHARED: ShieldAlert,
  NEW_DEVICE: Smartphone,
  FORCED_LOGOUT: LogOut,
  FACE_RESET: ScanFace,
  LOGIN_FAIL: KeyRound,
};

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const t = await getT();
  const locale = await getLocale();
  const { type, q } = await searchParams;
  const activeType = SECURITY_TYPES.find((s) => s === type);

  const [summary, events, accounts] = await Promise.all([
    securitySummary24h(),
    listSecurityEvents(activeType),
    listAccountsForSecurity(q),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.security.title")}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {t("adminOps.security.subtitle")}
        </p>
      </div>

      {/* Last 24 h */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SECURITY_TYPES.map((st) => {
          const Icon = ICON[st];
          return (
            <Link
              key={st}
              href={`/admin/security?type=${st}`}
              className="rounded-2xl border border-line bg-surface p-3 hover:border-brand-orange"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${TONE[st]}`}>
                <Icon size={15} />
              </span>
              <p className="mt-2 font-heading text-xl font-bold text-ink">{summary[st]}</p>
              <p className="text-[11px] leading-tight text-muted">{t("adminOps.security.last24h", { label: t(`adminOps.security.type.${st}`) })}</p>
            </Link>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/security"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            !activeType ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
          }`}
        >
          {t("adminOps.security.allEvents")}
        </Link>
        {SECURITY_TYPES.map((st) => (
          <Link
            key={st}
            href={`/admin/security?type=${st}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeType === st ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {t(`adminOps.security.type.${st}`)}
          </Link>
        ))}
      </div>

      {/* Events */}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {events.length === 0 && <p className="px-4 py-6 text-sm text-muted">{t("adminOps.security.noEvents")}</p>}
        {events.map((e) => {
          const et = e.type as SecurityType;
          return (
            <div key={e.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span
                className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[et] ?? "bg-surface-alt text-ink"}`}
              >
                {tOr(t, `adminOps.security.type.${et}`, e.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{e.userName ?? t("adminOps.security.unknownUser")}</p>
                <p className="truncate text-xs text-muted">
                  {e.detail}
                  {e.userAgent ? ` · ${e.userAgent}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted">
                {formatDate(e.createdAt.toISOString(), locale)} {formatTime(e.createdAt.toISOString(), locale)}
              </p>
              {e.userId && (et === "FACE_SHARED" || et === "FACE_FAIL") && (
                <ResetFaceButton userId={e.userId} name={e.userName ?? t("adminOps.security.thisUser")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Accounts */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Users size={18} /> {t("adminOps.security.accounts")}
          </h2>
          <form className="flex gap-2" action="/admin/security">
            {activeType && <input type="hidden" name="type" value={activeType} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("adminOps.security.searchPh")}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-brand-orange"
            />
            <button className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white">
              {t("common.search")}
            </button>
          </form>
        </div>
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {accounts.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{u.fullName}</p>
                <p className="text-xs text-muted">
                  <span dir="ltr">{u.phone}</span> · {tOr(t, `role.${u.role}`, u.role)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  u.hasFace ? "bg-emerald-50 text-emerald-700" : "bg-surface-alt text-muted"
                }`}
              >
                {u.hasFace ? t("adminOps.security.faceRegistered") : t("adminOps.security.noFace")}
              </span>
              <span className="text-xs text-muted">{u.devices === 1 ? t("adminOps.security.devicesOne") : t("adminOps.security.devicesMany", { n: u.devices })}</span>
              {u.hasFace && <ResetFaceButton userId={u.id} name={u.fullName} />}
            </div>
          ))}
          {accounts.length === 0 && <p className="px-4 py-6 text-sm text-muted">{t("adminOps.security.noAccount")}</p>}
        </div>
      </div>
    </div>
  );
}
