import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PERIODS, buildReport, type GroupKey, type PeriodKey } from "@/lib/db/reports";
import { formatDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; group?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const period: PeriodKey = sp.period && sp.period in PERIODS ? (sp.period as PeriodKey) : "90d";
  const group: GroupKey = sp.group === "month" ? "month" : "week";

  const data = await buildReport(period, group);
  const maxReq = Math.max(1, ...data.timeline.map((b) => b.requests));
  const q = `period=${period}&group=${group}`;
  const totalRevenue = data.timeline.reduce((s, b) => s + b.revenue, 0);
  const totalPlatform = data.timeline.reduce((s, b) => s + b.platform, 0);
  const totalCompleted = data.timeline.reduce((s, b) => s + b.completed, 0);

  const pill = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      on ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Reports</h1>
        <p className="mt-0.5 text-sm text-muted">Requests and revenue by period and by region, with CSV export.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(PERIODS).map(([k, p]) => (
          <Link key={k} href={`/admin/reports?period=${k}&group=${group}`} className={pill(period === k)}>
            {p.label}
          </Link>
        ))}
        <span className="mx-1 w-px bg-line" />
        <Link href={`/admin/reports?period=${period}&group=week`} className={pill(group === "week")}>
          By week
        </Link>
        <Link href={`/admin/reports?period=${period}&group=month`} className={pill(group === "month")}>
          By month
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Requests", String(data.total)],
          ["Completed", String(totalCompleted)],
          ["Revenue", formatDT(totalRevenue)],
          ["Platform fees", formatDT(totalPlatform)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{l}</p>
            <p className="font-heading text-xl font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink">
            {group === "week" ? "Per week" : "Per month"}
          </h2>
          <a
            href={`/admin/reports/export?${q}&kind=timeline`}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange"
          >
            <Download size={13} /> CSV
          </a>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {data.timeline.length === 0 && <p className="text-sm text-muted">No data for this period.</p>}
          {data.timeline.map((b) => (
            <div key={b.label} className="grid grid-cols-[84px_1fr_auto] items-center gap-3 text-xs">
              <span className="text-muted">{b.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-brand-orange" style={{ width: `${(b.requests / maxReq) * 100}%` }} />
              </div>
              <span className="text-right text-ink">
                {b.requests} req · {b.completed} done · {formatDT(b.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink">By region (client city)</h2>
          <a
            href={`/admin/reports/export?${q}&kind=region`}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange"
          >
            <Download size={13} /> CSV
          </a>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Requests</th>
                <th className="py-2 pr-3">Completed</th>
                <th className="py-2 pr-3">Revenue</th>
                <th className="py-2">Platform fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.regions.map((r) => (
                <tr key={r.region}>
                  <td className="py-2 pr-3 font-medium text-ink">{r.region}</td>
                  <td className="py-2 pr-3 text-muted">{r.requests}</td>
                  <td className="py-2 pr-3 text-muted">{r.completed}</td>
                  <td className="py-2 pr-3 text-muted">{formatDT(r.revenue)}</td>
                  <td className="py-2 text-muted">{formatDT(r.platform)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.regions.length === 0 && <p className="py-3 text-sm text-muted">No data for this period.</p>}
        </div>
      </div>
    </div>
  );
}
