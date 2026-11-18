import { requirePermission } from "@/lib/auth";
import { Wallet } from "lucide-react";
import { listAdminPayments } from "@/lib/db/admin";
import { formatDT, formatDate } from "@/lib/utils";
import Link from "next/link";
import { getT, getLocale } from "@/lib/i18n/server";
import { tOr } from "@/lib/i18n/translate";

const TYPE_TABS = [
  { label: "adminOps.payments.tabAll", value: undefined },
  { label: "adminOps.payments.tabPayouts", value: "PAYOUT" },
  { label: "adminOps.payments.tabSubs", value: "SUBSCRIPTION" },
  { label: "adminOps.payments.tabCommission", value: "COMMISSION" },
];

const TYPE_STYLE: Record<string, string> = {
  PAYOUT: "bg-success-light text-success",
  SUBSCRIPTION: "bg-blue-50 text-blue-700",
  COMMISSION: "bg-brand-orange-light text-brand-orange-dark",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requirePermission("payments");
  const t = await getT();
  const locale = await getLocale();
  const { type } = await searchParams;
  const payments = await listAdminPayments(type);

  const total = payments.reduce((s, p) => s + p.platformFee, 0);
  const gross = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.payments.title")}</h1>
        <p className="text-sm text-muted mt-0.5">{t("adminOps.payments.records", { n: payments.length })}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("adminOps.payments.gross")}</p>
          <p className="font-heading text-xl font-bold text-ink">{formatDT(gross, locale)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("adminOps.payments.fees")}</p>
          <p className="font-heading text-xl font-bold text-success">{formatDT(total, locale)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("adminOps.payments.netTech")}</p>
          <p className="font-heading text-xl font-bold text-ink">{formatDT(gross - total, locale)}</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_TABS.map((tab) => (
          <Link
            key={t(tab.label)}
            href={tab.value ? `/admin/payments?type=${tab.value}` : "/admin/payments"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === tab.value || (!type && !tab.value)
                ? "bg-brand-navy text-white"
                : "bg-surface border border-line text-muted hover:text-ink"
            }`}
          >
            {t(tab.label)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {["adminOps.payments.colTech", "adminOps.payments.colType", "adminOps.payments.colMethod", "adminOps.payments.colGross", "adminOps.payments.colFee", "adminOps.payments.colNet", "adminOps.payments.colDate", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-muted">
                  {h ? t(h) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3 font-medium text-ink">{p.technicianFullName}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLE[p.type] ?? "bg-surface-alt text-muted"}`}>
                    {tOr(t, `paymentType.${p.type}`, p.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{tOr(t, `paymentMethod.${p.method}`, p.method)}</td>
                <td className="px-4 py-3 text-ink font-medium">{formatDT(p.amount, locale)}</td>
                <td className="px-4 py-3 text-success font-medium">{formatDT(p.platformFee, locale)}</td>
                <td className="px-4 py-3 text-muted">{formatDT(p.amount - p.platformFee, locale)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(p.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  {p.requestId && (
                    <Link href={`/admin/requests/${p.requestId}`} className="text-xs font-semibold text-brand-orange hover:underline">
                      {t("adminOps.payments.job")} <span className="inline-block rtl:rotate-180">→</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Wallet size={28} className="text-muted" />
            <p className="text-sm text-muted">{t("adminOps.payments.none")}</p>
          </div>
        )}
      </div>
    </div>
  );
}