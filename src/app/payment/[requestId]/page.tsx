import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Building2, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestById } from "@/lib/db/requests";
import { getJobPaymentInfo } from "@/lib/db/monetization";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDT } from "@/lib/utils";
import { confirmPaymentAction } from "./actions";

const METHODS = [
  {
    value: "FLOUCI",
    label: "Flouci",
    icon: CreditCard,
    desc: (phone: string) => `Send to technician Flouci: ${phone}`,
  },
  {
    value: "D17",
    label: "D17",
    icon: CreditCard,
    desc: (phone: string) => `Send to technician D17: ${phone}`,
  },
  {
    value: "BANK_TRANSFER",
    label: "Virement Bancaire",
    icon: Building2,
    desc: () => "Contact the technician for their RIB details",
  },
  {
    value: "CASH",
    label: "Cash",
    icon: Banknote,
    desc: () => "Pay the technician directly in person",
  },
];

export default async function ClientPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireUser();
  const { requestId } = await params;
  const { error } = await searchParams;

  const req = await getRequestById(requestId);
  if (!req) notFound();
  if (req.clientId !== session.userId) redirect("/requests");
  if (req.status !== "COMPLETED") redirect(`/requests/${requestId}`);

  const payment = await getJobPaymentInfo(requestId);
  if (!payment) redirect(`/requests/${requestId}`);

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href={`/requests/${requestId}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <p className="font-heading text-base font-semibold text-ink">Pay for Service</p>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        {error && (
          <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
            {decodeURIComponent(error)}
          </p>
        )}

        {/* Job summary card */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              src={payment.technicianAvatarUrl}
              name={payment.technicianName}
              size={48}
            />
            <div>
              <p className="font-heading text-sm font-semibold text-ink">
                {payment.technicianName}
              </p>
              <p className="text-xs text-muted">{req.categoryName}</p>
            </div>
          </div>
          <div className="border-t border-line pt-3 flex items-center justify-between">
            <p className="text-sm text-muted">Service fee</p>
            <p className="font-heading text-lg font-bold text-ink">
              {formatDT(payment.amount)}
            </p>
          </div>
        </div>

        {/* Total banner */}
        <div className="flex items-center justify-between rounded-2xl bg-brand-navy px-5 py-4 text-white">
          <p className="text-sm font-medium text-white/70">Total to pay</p>
          <p className="font-heading text-2xl font-bold">{formatDT(payment.amount)}</p>
        </div>

        {/* Payment method form */}
        <form action={confirmPaymentAction} className="flex flex-col gap-4">
          <input type="hidden" name="requestId" value={requestId} />

          <p className="font-heading text-sm font-semibold text-ink">
            Choose payment method
          </p>

          {METHODS.map(({ value, label, icon: Icon, desc }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 cursor-pointer has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light transition-colors"
            >
              <input type="radio" name="method" value={value} className="sr-only" required />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt">
                <Icon size={18} className="text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-muted">{desc(payment.technicianPhone)}</p>
              </div>
            </label>
          ))}

          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Send the payment to the technician first, then click confirm below so we
              can update your job record.
            </p>
          </div>

          <Button type="submit" fullWidth size="lg">
            <CheckCircle2 size={18} />
            Confirm Payment — {formatDT(payment.amount)}
          </Button>
        </form>
      </div>
    </div>
  );
}