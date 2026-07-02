import Link from "next/link";
import { CheckCircle2, Home, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <div className="app-content flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {/* Success icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success-light mb-6">
          <CheckCircle2 size={48} className="text-success" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-ink">
          Payment Confirmed!
        </h1>
        <p className="mt-2 text-[15px] text-muted leading-relaxed max-w-xs">
          Your payment has been recorded. Thank you for using FixiTN — we hope the job
          went smoothly!
        </p>

        {/* Divider */}
        <div className="my-8 w-16 h-0.5 rounded-full bg-line" />

        <p className="text-sm text-muted">
          Don't forget to leave a review to help other clients find great technicians.
        </p>

        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
          <Link href={`/requests/${requestId}/rate`}>
            <Button fullWidth size="lg">
              Leave a Review
            </Button>
          </Link>
          <Link href={`/requests/${requestId}`}>
            <Button fullWidth size="lg" variant="outline">
              <ClipboardList size={18} />
              View Job Details
            </Button>
          </Link>
          <Link href="/">
            <Button fullWidth size="lg" variant="ghost">
              <Home size={18} />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}