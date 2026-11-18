import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, CheckCircle2, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPaymentsForTechnician } from "@/lib/db/monetization";
import { TechBottomNav } from "@/components/TechBottomNav";
import { EmptyState } from "@/components/ui/Card";
import { formatDT, formatDate } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";

export default async function TechPayoutHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
  const t = await getT();
  const locale = await getLocale();
  const { success } = await searchParams;

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const payments = await listPaymentsForTechnician(technician.id, 50);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Link
            href="/t/payout"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </Link>
          <p className="font-heading text-lg font-semibold text-ink">{t("tech.payout.historyTitle")}</p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <p className="text-sm font-medium text-success">
                {t("tech.payout.submitted")}
              </p>
            </div>
          )}

          {payments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t("tech.payout.historyEmpty")}
              description={t("tech.payout.historyEmptyHint")}
            />
          ) : (
            <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
              {payments.map((p) => {
                const isCredit = p.type === "PAYOUT";
                const net = p.amount - p.platformFee;
                const isPending = p.status === "PENDING";

                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isPending
                          ? "bg-amber-50"
                          : isCredit
                          ? "bg-success-light"
                          : "bg-danger-light"
                      }`}
                    >
                      {isPending ? (
                        <Clock size={18} className="text-amber-600" />
                      ) : (
                        <Wallet
                          size={18}
                          className={isCredit ? "text-success" : "text-danger"}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {p.type === "PAYOUT" ? t("tech.earnings.typePayout") : t(`paymentType.${p.type}`)}
                      </p>
                      <p className="text-xs text-muted">
                        {t(`paymentMethod.${p.method}`)} · {formatDate(p.createdAt, locale)}
                      </p>
                    </div>

                    <div className="text-end shrink-0">
                      <p
                        className={`font-heading text-sm font-semibold ${
                          isPending
                            ? "text-amber-600"
                            : isCredit
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatDT(isCredit ? net : p.amount, locale)}
                      </p>
                      <p className="text-[10px] text-muted">
                        {t(`paymentStatus.${p.status}`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}