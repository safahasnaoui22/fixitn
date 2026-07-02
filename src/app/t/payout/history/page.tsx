import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, CheckCircle2, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPaymentsForTechnician } from "@/lib/db/monetization";
import { TechBottomNav } from "@/components/TechBottomNav";
import { EmptyState } from "@/components/ui/Card";
import { formatDT, formatDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  PAYOUT: "Job payout",
  SUBSCRIPTION: "Subscription",
  COMMISSION: "Commission",
};

const METHOD_LABEL: Record<string, string> = {
  D17: "D17",
  FLOUCI: "Flouci",
  BANK_TRANSFER: "Virement Bancaire",
  CASH: "Cash",
};

export default async function TechPayoutHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
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
            <ArrowLeft size={18} />
          </Link>
          <p className="font-heading text-lg font-semibold text-ink">Payout History</p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <p className="text-sm font-medium text-success">
                Payout request submitted — we'll process it within 48 hours.
              </p>
            </div>
          )}

          {payments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Completed jobs and payout requests will appear here."
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
                        {TYPE_LABEL[p.type] ?? p.type}
                      </p>
                      <p className="text-xs text-muted">
                        {METHOD_LABEL[p.method] ?? p.method} · {formatDate(p.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
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
                        {formatDT(isCredit ? net : p.amount)}
                      </p>
                      <p className="text-[10px] text-muted capitalize">
                        {isPending ? "Pending" : p.status.toLowerCase()}
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