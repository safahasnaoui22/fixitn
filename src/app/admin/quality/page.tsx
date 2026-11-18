import Link from "next/link";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listTechnicianQuality, type TechQuality } from "@/lib/db/quality";
import { getT } from "@/lib/i18n/server";
import type { TFn } from "@/lib/i18n/translate";
import {
  warnTechnicianAction,
  suspendTechnicianAction,
  reactivateTechnicianAction,
  setSeniorAction,
} from "./actions";

export const dynamic = "force-dynamic";

const SORTS: Record<string, { label: string; fn: (a: TechQuality, b: TechQuality) => number }> = {
  rating: { label: "adminOps.quality.sort.rating", fn: (a, b) => (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1) },
  jobs: { label: "adminOps.quality.sort.jobs", fn: (a, b) => b.jobsDone - a.jobsDone },
  cancel: { label: "adminOps.quality.sort.cancel", fn: (a, b) => (b.cancelRate ?? -1) - (a.cancelRate ?? -1) },
  response: { label: "adminOps.quality.sort.response", fn: (a, b) => (a.responseMin ?? 1e9) - (b.responseMin ?? 1e9) },
};

function fmtMin(m: number | null, t: TFn) {
  if (m == null) return "—";
  if (m < 60) return t("adminOps.quality.min", { n: Math.round(m) });
  return t("adminOps.quality.hours", { n: (m / 60).toFixed(1) });
}

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await requireRole("ADMIN");
  const t = await getT();
  const { sort } = await searchParams;
  const key = sort && SORTS[sort] ? sort : "rating";
  const rows = (await listTechnicianQuality()).sort(SORTS[key].fn);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.quality.title")}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {t("adminOps.quality.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(SORTS).map(([k, s]) => (
          <Link
            key={k}
            href={`/admin/quality?sort=${k}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              key === k ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {t("adminOps.quality.sortBy", { label: t(s.label) })}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-sm text-muted">{t("adminOps.quality.none")}</p>
        )}
        {rows.map((q) => {
          const lowRating = q.ratingAvg != null && q.reviewCount >= 3 && q.ratingAvg < 3.5;
          const highCancel = q.cancelRate != null && q.totalJobs >= 5 && q.cancelRate > 0.3;
          const suspended = q.status === "ARCHIVED";
          return (
            <div key={q.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/technicians/${q.id}`} className="font-semibold text-ink hover:text-brand-orange">
                  {q.name}
                </Link>
                {q.isSenior && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{t("adminOps.quality.badge.senior")}</span>
                )}
                {suspended && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">{t("adminOps.quality.badge.suspended")}</span>
                )}
                {lowRating && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">{t("adminOps.quality.badge.lowRating")}</span>
                )}
                {highCancel && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {t("adminOps.quality.badge.manyCancel")}
                  </span>
                )}
                <span className="ms-auto text-xs text-muted">
                  {q.title} · <span dir="ltr">{q.phone}</span>
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t("adminOps.quality.stat.rating")} value={q.ratingAvg != null ? q.ratingAvg.toFixed(1) : "—"} sub={t("adminOps.quality.stat.reviews", { n: q.reviewCount })} icon />
                <Stat label={t("adminOps.quality.stat.jobsDone")} value={String(q.jobsDone)} sub={t("adminOps.quality.stat.received", { n: q.totalJobs })} />
                <Stat
                  label={t("adminOps.quality.stat.cancel")}
                  value={q.cancelRate != null ? `${Math.round(q.cancelRate * 100)}%` : "—"}
                  sub={t("adminOps.quality.stat.cancelSub")}
                />
                <Stat label={t("adminOps.quality.stat.response")} value={fmtMin(q.responseMin, t)} sub={t("adminOps.quality.stat.responseSub")} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={warnTechnicianAction.bind(null, q.id)} className="flex min-w-0 flex-1 gap-2">
                  <input
                    name="message"
                    placeholder={t("adminOps.quality.warnPh")}
                    className="min-w-0 flex-1 rounded-full border border-line bg-surface-alt px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-orange"
                  />
                  <button className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    {t("adminOps.quality.warn")}
                  </button>
                </form>
                <form action={setSeniorAction.bind(null, q.id, !q.isSenior)}>
                  <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                    {q.isSenior ? t("adminOps.quality.removeSenior") : t("adminOps.quality.makeSenior")}
                  </button>
                </form>
                {suspended ? (
                  <form action={reactivateTechnicianAction.bind(null, q.id)}>
                    <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                      {t("adminOps.quality.reactivate")}
                    </button>
                  </form>
                ) : (
                  <form action={suspendTechnicianAction.bind(null, q.id)}>
                    <button className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
                      {t("adminOps.quality.suspend")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="flex items-center gap-1 font-heading text-lg font-bold text-ink">
        {icon && <Star size={14} className="fill-star text-star" />}
        {value}
      </p>
      <p className="text-[10px] text-muted">{sub}</p>
    </div>
  );
}
