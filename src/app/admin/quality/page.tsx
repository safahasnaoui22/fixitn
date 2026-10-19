import Link from "next/link";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listTechnicianQuality, type TechQuality } from "@/lib/db/quality";
import {
  warnTechnicianAction,
  suspendTechnicianAction,
  reactivateTechnicianAction,
  setSeniorAction,
} from "./actions";

export const dynamic = "force-dynamic";

const SORTS: Record<string, { label: string; fn: (a: TechQuality, b: TechQuality) => number }> = {
  rating: { label: "Rating", fn: (a, b) => (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1) },
  jobs: { label: "Jobs done", fn: (a, b) => b.jobsDone - a.jobsDone },
  cancel: { label: "Cancellation", fn: (a, b) => (b.cancelRate ?? -1) - (a.cancelRate ?? -1) },
  response: { label: "Response time", fn: (a, b) => (a.responseMin ?? 1e9) - (b.responseMin ?? 1e9) },
};

function fmtMin(m: number | null) {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)} min`;
  return `${(m / 60).toFixed(1)} h`;
}

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await requireRole("ADMIN");
  const { sort } = await searchParams;
  const key = sort && SORTS[sort] ? sort : "rating";
  const rows = (await listTechnicianQuality()).sort(SORTS[key].fn);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Technician quality</h1>
        <p className="mt-0.5 text-sm text-muted">
          Rating, jobs, cancellations and response time. Warn, suspend or promote in one click.
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
            Sort by {s.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-sm text-muted">No technician yet.</p>
        )}
        {rows.map((t) => {
          const lowRating = t.ratingAvg != null && t.reviewCount >= 3 && t.ratingAvg < 3.5;
          const highCancel = t.cancelRate != null && t.totalJobs >= 5 && t.cancelRate > 0.3;
          const suspended = t.status === "ARCHIVED";
          return (
            <div key={t.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/technicians/${t.id}`} className="font-semibold text-ink hover:text-brand-orange">
                  {t.name}
                </Link>
                {t.isSenior && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">SENIOR</span>
                )}
                {suspended && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">SUSPENDED</span>
                )}
                {lowRating && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">LOW RATING</span>
                )}
                {highCancel && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    MANY CANCELLATIONS
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {t.title} · {t.phone}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Rating" value={t.ratingAvg != null ? t.ratingAvg.toFixed(1) : "—"} sub={`${t.reviewCount} reviews`} icon />
                <Stat label="Jobs done" value={String(t.jobsDone)} sub={`${t.totalJobs} received`} />
                <Stat
                  label="Cancellation"
                  value={t.cancelRate != null ? `${Math.round(t.cancelRate * 100)}%` : "—"}
                  sub="declined + cancelled"
                />
                <Stat label="Response time" value={fmtMin(t.responseMin)} sub="to accept a request" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={warnTechnicianAction.bind(null, t.id)} className="flex min-w-0 flex-1 gap-2">
                  <input
                    name="message"
                    placeholder="Warning message (optional)"
                    className="min-w-0 flex-1 rounded-full border border-line bg-surface-alt px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-orange"
                  />
                  <button className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    Warn
                  </button>
                </form>
                <form action={setSeniorAction.bind(null, t.id, !t.isSenior)}>
                  <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                    {t.isSenior ? "Remove Senior" : "Make Senior"}
                  </button>
                </form>
                {suspended ? (
                  <form action={reactivateTechnicianAction.bind(null, t.id)}>
                    <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Reactivate
                    </button>
                  </form>
                ) : (
                  <form action={suspendTechnicianAction.bind(null, t.id)}>
                    <button className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Suspend
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
