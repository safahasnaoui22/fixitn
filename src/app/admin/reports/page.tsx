import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PERIODS, buildReport, type GroupKey, type PeriodKey } from "@/lib/db/reports";
import { formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; group?: string }>;
}) {
  await requireRole("ADMIN");
  const t = await getT();
  const locale = await getLocale();
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
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.reports.title")}</h1>
        <p className="mt-0.5 text-sm text-muted">{t("adminOps.reports.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(PERIODS).map((k) => (
          <Link key={k} href={`/admin/reports?period=${k}&group=${group}`} className={pill(period === k)}>
            {t(`adminOps.reports.period.${k}`)}
          </Link>
        ))}
        <span className="mx-1 w-px bg-line" />
        <Link href={`/admin/reports?period=${period}&group=week`} className={pill(group === "week")}>
          {t("adminOps.reports.byWeek")}
        </Link>
        <Link href={`/admin/reports?period=${period}&group=month`} className={pill(group === "month")}>
          {t("adminOps.reports.byMonth")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t("adminOps.reports.requests"), String(data.total)],
          [t("adminOps.reports.completed"), String(totalCompleted)],
          [t("adminOps.reports.revenue"), formatDT(totalRevenue, locale)],
          [t("adminOps.reports.platformFees"), formatDT(totalPlatform, locale)],
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
            {group === "week" ? t("adminOps.reports.perWeek") : t("adminOps.reports.perMonth")}
          </h2>
          <a
            href={`/admin/reports/export?${q}&kind=timeline`}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange"
          >
            <Download size={13} /> {t("adminOps.reports.csv")}
          </a>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {data.timeline.length === 0 && <p className="text-sm text-muted">{t("adminOps.reports.noData")}</p>}
          {data.timeline.map((b) => (
            <div key={b.label} className="grid grid-cols-[84px_1fr_auto] items-center gap-3 text-xs">
              <span className="text-muted">{b.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-brand-orange" style={{ width: `${(b.requests / maxReq) * 100}%` }} />
              </div>
              <span className="text-end text-ink">
                {t("adminOps.reports.row", { req: b.requests, done: b.completed, rev: formatDT(b.revenue, locale) })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink">{t("adminOps.reports.byRegion")}</h2>
          <a
            href={`/admin/reports/export?${q}&kind=region`}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange"
          >
            <Download size={13} /> {t("adminOps.reports.csv")}
          </a>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pe-3">{t("adminOps.reports.region")}</th>
                <th className="py-2 pe-3">{t("adminOps.reports.requests")}</th>
                <th className="py-2 pe-3">{t("adminOps.reports.completed")}</th>
                <th className="py-2 pe-3">{t("adminOps.reports.revenue")}</th>
                <th className="py-2">{t("adminOps.reports.platformFees")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.regions.map((r) => (
                <tr key={r.region}>
                  <td className="py-2 pe-3 font-medium text-ink">{r.region}</td>
                  <td className="py-2 pe-3 text-muted">{r.requests}</td>
                  <td className="py-2 pe-3 text-muted">{r.completed}</td>
                  <td className="py-2 pe-3 text-muted">{formatDT(r.revenue, locale)}</td>
                  <td className="py-2 text-muted">{formatDT(r.platform, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.regions.length === 0 && <p className="py-3 text-sm text-muted">{t("adminOps.reports.noData")}</p>}
        </div>
      </div>
    </div>
  );
}
