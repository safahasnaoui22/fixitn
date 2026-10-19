import Link from "next/link";
import { ShieldAlert, ScanFace, Smartphone, LogOut, KeyRound, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  SECURITY_LABEL,
  SECURITY_TYPES,
  listAccountsForSecurity,
  listSecurityEvents,
  securitySummary24h,
  type SecurityType,
} from "@/lib/db/security";
import { ResetFaceButton } from "@/components/ResetFaceButton";
import { formatDate, formatTime } from "@/lib/utils";

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
  const { type, q } = await searchParams;
  const activeType = SECURITY_TYPES.find((t) => t === type);

  const [summary, events, accounts] = await Promise.all([
    securitySummary24h(),
    listSecurityEvents(activeType),
    listAccountsForSecurity(q),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Security center</h1>
        <p className="mt-0.5 text-sm text-muted">
          Face checks, shared faces, new devices and forced logouts. One face = one account, one active device.
        </p>
      </div>

      {/* Last 24 h */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SECURITY_TYPES.map((t) => {
          const Icon = ICON[t];
          return (
            <Link
              key={t}
              href={`/admin/security?type=${t}`}
              className="rounded-2xl border border-line bg-surface p-3 hover:border-brand-orange"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${TONE[t]}`}>
                <Icon size={15} />
              </span>
              <p className="mt-2 font-heading text-xl font-bold text-ink">{summary[t]}</p>
              <p className="text-[11px] leading-tight text-muted">{SECURITY_LABEL[t]} · 24 h</p>
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
          All events
        </Link>
        {SECURITY_TYPES.map((t) => (
          <Link
            key={t}
            href={`/admin/security?type=${t}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeType === t ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {SECURITY_LABEL[t]}
          </Link>
        ))}
      </div>

      {/* Events */}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {events.length === 0 && <p className="px-4 py-6 text-sm text-muted">No events yet.</p>}
        {events.map((e) => {
          const t = e.type as SecurityType;
          return (
            <div key={e.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span
                className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[t] ?? "bg-surface-alt text-ink"}`}
              >
                {SECURITY_LABEL[t] ?? e.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{e.userName ?? "Unknown user"}</p>
                <p className="truncate text-xs text-muted">
                  {e.detail}
                  {e.userAgent ? ` · ${e.userAgent}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted">
                {formatDate(e.createdAt.toISOString())} {formatTime(e.createdAt.toISOString())}
              </p>
              {e.userId && (t === "FACE_SHARED" || t === "FACE_FAIL") && (
                <ResetFaceButton userId={e.userId} name={e.userName ?? "this user"} />
              )}
            </div>
          );
        })}
      </div>

      {/* Accounts */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Users size={18} /> Accounts &amp; faces
          </h2>
          <form className="flex gap-2" action="/admin/security">
            {activeType && <input type="hidden" name="type" value={activeType} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name or phone"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-brand-orange"
            />
            <button className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        </div>
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {accounts.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{u.fullName}</p>
                <p className="text-xs text-muted">
                  {u.phone} · {u.role}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  u.hasFace ? "bg-emerald-50 text-emerald-700" : "bg-surface-alt text-muted"
                }`}
              >
                {u.hasFace ? "Face registered" : "No face yet"}
              </span>
              <span className="text-xs text-muted">{u.devices} device{u.devices === 1 ? "" : "s"}</span>
              {u.hasFace && <ResetFaceButton userId={u.id} name={u.fullName} />}
            </div>
          ))}
          {accounts.length === 0 && <p className="px-4 py-6 text-sm text-muted">No account found.</p>}
        </div>
      </div>
    </div>
  );
}
