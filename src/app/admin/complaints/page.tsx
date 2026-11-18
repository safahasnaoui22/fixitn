import Link from "next/link";
import { Flag, MessageSquareWarning } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ClickableRow } from "@/components/admin/ClickableRow";
import { formatDateTime } from "@/lib/utils";
import { tDb } from "@/lib/i18n/translate";
import { getT, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const COMPLAINT_STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"];

const STATUS_CLS: Record<string, string> = {
  RESOLVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-surface-alt text-muted",
  INVESTIGATING: "bg-amber-50 text-amber-700",
  OPEN: "bg-red-50 text-red-700",
};

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("complaints");
  const { status } = await searchParams;
  const filter = status && COMPLAINT_STATUSES.includes(status) ? status : undefined;

  const [reports, allStatuses] = await Promise.all([
    prisma.report.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 300,
      select: {
        id: true,
        requestId: true,
        reporterName: true,
        reportedName: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.report.groupBy({ by: ["status"], _count: true }),
  ]);

  const count = (s: string) => allStatuses.find((x) => x.status === s)?._count ?? 0;
  const total = allStatuses.reduce((n, x) => n + x._count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Flag size={22} className="text-brand-orange" />
          <h1 className="font-heading text-2xl font-bold text-ink">{t("adminSup.complaints.title")}</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          {t("adminSup.complaints.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: undefined, label: t("adminSup.complaints.filterAll", { n: total }) },
          ...COMPLAINT_STATUSES.map((s) => ({
            key: s as string | undefined,
            label: t("adminSup.complaints.filter", { label: t(`adminSup.complaints.status.${s}`), n: count(s) }),
          })),
        ].map((f) => (
          <Link
            key={f.label}
            href={f.key ? `/admin/complaints?status=${f.key}` : "/admin/complaints"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-brand-navy text-white"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {reports.length === 0 ? (
          <div className="p-10 text-center">
            <MessageSquareWarning size={28} className="mx-auto text-muted" />
            <p className="mt-3 font-semibold text-ink">{t("adminSup.complaints.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("adminSup.complaints.emptyDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  {["date", "reportedBy", "against", "reason", "request", "status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-muted">
                      {t(`adminSup.complaints.col.${h}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.map((r) => (
                  <ClickableRow key={r.id} href={`/admin/complaints/${r.id}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(r.createdAt.toISOString(), locale)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.reporterName}</td>
                    <td className="px-4 py-3 text-muted">{r.reportedName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink">{tDb(t, "reportReason", r.reason)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {r.requestId ? `#${r.requestId.slice(-6)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[r.status] ?? "bg-surface-alt text-muted"}`}>
                        {COMPLAINT_STATUSES.includes(r.status) ? t(`adminSup.complaints.status.${r.status}`) : r.status}
                      </span>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
