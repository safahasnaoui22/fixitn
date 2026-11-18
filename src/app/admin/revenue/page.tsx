import { requirePermission } from "@/lib/auth";
import { TrendingUp, Wallet, Briefcase, CreditCard } from "lucide-react";
import { getRevenueStats } from "@/lib/db/admin";
import { formatDT } from "@/lib/utils";
import { tOr } from "@/lib/i18n/translate";
import { getT, getLocale } from "@/lib/i18n/server";
import { intlLocale, type Locale } from "@/lib/i18n/config";

function formatMonth(ym: string, locale: Locale) {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString(intlLocale(locale), {
    month: "short",
    year: "numeric",
  });
}

export default async function AdminRevenuePage() {
  await requirePermission("revenue");
  const t = await getT();
  const locale = await getLocale();
  const stats = await getRevenueStats();
  const maxFee = Math.max(...stats.monthly.map((m) => Number(m.fee)), 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.revenue.title")}</h1>
        <p className="text-sm text-muted mt-0.5">{t("adminOps.revenue.subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-light mb-3">
            <TrendingUp size={20} className="text-success" />
          </div>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(stats.totalFees, locale)}</p>
          <p className="text-xs text-muted mt-0.5">{t("adminOps.revenue.totalFees")}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange-light mb-3">
            <Wallet size={20} className="text-brand-orange" />
          </div>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(stats.totalGross, locale)}</p>
          <p className="text-xs text-muted mt-0.5">{t("adminOps.revenue.totalGross")}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-3">
            <Briefcase size={20} className="text-blue-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-ink">{stats.totalJobs}</p>
          <p className="text-xs text-muted mt-0.5">{t("adminOps.revenue.totalJobs")}</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-sm font-semibold text-ink mb-5">
          {t("adminOps.revenue.monthlyTitle")}
        </p>
        {stats.monthly.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t("adminOps.revenue.noPayments")}</p>
        ) : (
          <div dir="ltr" className="flex items-end gap-2 h-40">
            {stats.monthly.map((m) => {
              const fee = Number(m.fee);
              const pct = Math.round((fee / maxFee) * 100);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted">{formatDT(fee, locale)}</span>
                  <div className="w-full flex items-end" style={{ height: "96px" }}>
                    <div
                      className="w-full rounded-t-lg bg-brand-orange transition-all"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted text-center leading-tight">
                    {formatMonth(m.month, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment method breakdown */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-sm font-semibold text-ink mb-4">{t("adminOps.revenue.byMethod")}</p>
        {stats.byMethod.length === 0 ? (
          <p className="text-sm text-muted">{t("adminOps.revenue.noData")}</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {stats.byMethod.map((b) => {
              const pct = stats.totalFees > 0 ? Math.round((b.fees / stats.totalFees) * 100) : 0;
              return (
                <div key={b.method} className="flex items-center gap-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                    <CreditCard size={16} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-ink">
                        {tOr(t, `paymentMethod.${b.method}`, b.method)}
                      </p>
                      <p className="text-sm font-semibold text-ink">{formatDT(b.fees, locale)}</p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-alt overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1">
                      {t("adminOps.revenue.jobsShare", { n: b.count, pct })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}