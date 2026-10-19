import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDate, formatTime } from "@/lib/utils";
import { updateReportAction } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "OPEN", label: "Open" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
];
const TONE: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  INVESTIGATING: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
};

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const active = TABS.find((t) => t.value === status)?.value ?? "OPEN";

  const [counts, reports] = await Promise.all([
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.report.findMany({
      where: { status: active },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Disputes &amp; reports</h1>
        <p className="mt-0.5 text-sm text-muted">
          Problems reported by clients and technicians on a job.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/disputes?status=${t.value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              active === t.value ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {t.label} ({countOf(t.value)})
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-sm text-muted">
            Nothing here.
          </p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[r.status]}`}>{r.status}</span>
              <p className="text-sm font-semibold text-ink">{r.reason}</p>
              <p className="ml-auto text-xs text-muted">
                {formatDate(r.createdAt.toISOString())} {formatTime(r.createdAt.toISOString())}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted">
              <span className="font-semibold text-ink">{r.reporterName}</span> reported{" "}
              <span className="font-semibold text-ink">{r.reportedName ?? "—"}</span>
              {r.requestId && (
                <>
                  {" · "}
                  <Link href={`/admin/requests/${r.requestId}`} className="font-semibold text-brand-orange">
                    Open the job
                  </Link>
                </>
              )}
            </p>
            {r.details && <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{r.details}</p>}

            <form action={updateReportAction.bind(null, r.id)} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <textarea
                name="adminNote"
                rows={2}
                defaultValue={r.adminNote ?? ""}
                placeholder="Private note / what we decided (the reporter sees it in the notification)"
                className="flex-1 rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-brand-orange"
              />
              <div className="flex gap-2 sm:flex-col">
                <select
                  name="status"
                  defaultValue={r.status}
                  className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
                >
                  {TABS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button className="rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
            {r.handledBy && (
              <p className="mt-2 text-[11px] text-muted">Last handled by {r.handledBy}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
