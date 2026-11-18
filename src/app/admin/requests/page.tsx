import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { listAdminRequests } from "@/lib/db/admin";
import { StatusBadge } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { JOB_STATUSES } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("requests");
  const { status } = await searchParams;
  const requests = await listAdminRequests(status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("admin.requests.title")}</h1>
        <p className="text-sm text-muted mt-0.5">{status ? `${requests.length} ${t(`jobStatus.${status}`)}` : t("admin.requests.total", { count: requests.length })}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/requests" className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!status ? "bg-brand-navy text-white" : "bg-surface border border-line text-muted hover:text-ink"}`}>{t("common.all")}</Link>
        {JOB_STATUSES.map((s) => (
          <Link key={s} href={`/admin/requests?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${status === s ? "bg-brand-navy text-white" : "bg-surface border border-line text-muted hover:text-ink"}`}>
            {t(`jobStatus.${s}`)}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {[t("admin.requests.col.category"), t("admin.requests.col.client"), t("admin.requests.col.technician"), t("common.status"), t("admin.requests.col.solved"), t("common.date"), ""].map((h) => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3 font-medium text-ink">{req.categoryName}</td>
                <td className="px-4 py-3 text-muted">{req.clientFullName}</td>
                <td className="px-4 py-3 text-muted">{req.technicianFullName}</td>
                <td className="px-4 py-3"><StatusBadge status={req.status as import("@/lib/constants").JobStatus} /></td>
                <td className="px-4 py-3">
                  {req.clientConfirmedSolved === null ? <span className="text-muted text-xs">—</span>
                    : req.clientConfirmedSolved ? <span className="text-xs font-semibold text-success">✓ {t("common.yes")}</span>
                    : <span className="text-xs font-semibold text-danger">✗ {t("common.no")}</span>}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(req.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/requests/${req.id}`} className="text-xs font-semibold text-brand-orange hover:underline">{t("common.view")}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList size={28} className="text-muted" />
            <p className="text-sm text-muted">{t("admin.requests.empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}