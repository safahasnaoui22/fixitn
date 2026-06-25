import { redirect } from "next/navigation";
import { TrendingUp, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { getTechnicianEarnings, listPaymentsForTechnician } from "@/lib/db/monetization";
import { TechBottomNav } from "@/components/TechBottomNav";
import { EmptyState } from "@/components/ui/Card";
import { formatDT, formatDate } from "@/lib/utils";

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  PAYOUT: "Job payout",
  COMMISSION: "Commission",
  SUBSCRIPTION: "Subscription",
};

const PAYMENT_TYPE_COLOR: Record<string, string> = {
  PAYOUT: "text-success",
  COMMISSION: "text-danger",
  SUBSCRIPTION: "text-brand-navy",
};

export default async function TechEarningsPage() {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [earnings, payments] = await Promise.all([
    getTechnicianEarnings(technician.id),
    listPaymentsForTechnician(technician.id, 30),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-5">Earnings</p>
          <div className="grid grid-cols-3 gap-2">
            <EarningBox label="Today" value={formatDT(earnings.today)} />
            <EarningBox label="This month" value={formatDT(earnings.thisMonth)} />
            <EarningBox label="All time" value={formatDT(earnings.total)} />
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <TrendingUp size={18} className="text-success mb-2" />
              <p className="font-heading text-xl font-bold text-ink">
                {formatDT(earnings.thisMonth)}
              </p>
              <p className="text-xs text-muted mt-0.5">This month net</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <Wallet size={18} className="text-brand-orange mb-2" />
              <p className="font-heading text-xl font-bold text-ink">
                {formatDT(earnings.total)}
              </p>
              <p className="text-xs text-muted mt-0.5">Total net earned</p>
            </div>
          </div>

          <div>
            <p className="font-heading text-sm font-semibold text-ink mb-3">
              Payment History
            </p>
            {payments.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No payments yet"
                description="Completed jobs and subscription charges will appear here."
              />
            ) : (
              <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                {payments.map((p) => {
                  const net = p.amount - p.platformFee;
                  const isCredit = p.type === "PAYOUT";
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? "bg-success-light" : "bg-danger-light"
                        }`}
                      >
                        <Wallet size={16} className={isCredit ? "text-success" : "text-danger"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {PAYMENT_TYPE_LABEL[p.type] ?? p.type}
                        </p>
                        <p className="text-xs text-muted">{formatDate(p.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-heading text-sm font-semibold ${PAYMENT_TYPE_COLOR[p.type] ?? "text-ink"}`}>
                          {isCredit ? "+" : "-"}{formatDT(isCredit ? net : p.amount)}
                        </p>
                        {p.platformFee > 0 && isCredit && (
                          <p className="text-[10px] text-muted">-{formatDT(p.platformFee)} fee</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}

function EarningBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white/10 px-3 py-2.5">
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="font-heading text-sm font-bold text-white">{value}</p>
    </div>
  );
}