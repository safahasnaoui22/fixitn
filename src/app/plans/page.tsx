import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import { Button } from "@/components/ui/Button";
import { cn, formatDT } from "@/lib/utils";
import { subscribePlanAction } from "./actions";

export default async function PlansPage() {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const plans = await listPlans();
  const currentPlanId = technician.planId;

  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link href="/t/dashboard" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">Choose a Plan</p>
          <p className="text-xs text-muted">Lower your commission, grow faster</p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-4">
        <div className="rounded-2xl bg-brand-navy px-4 py-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-brand-orange" />
            <p className="font-heading text-sm font-semibold">How commission works</p>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            FixiTN keeps a small % of each job you complete. Pro plans reduce that percentage significantly, so you keep more of every payment.
          </p>
        </div>

        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPro = plan.key !== "FREE";
          return (
            <div key={plan.id} className={cn("rounded-2xl border-2 bg-surface overflow-hidden", isCurrent ? "border-brand-orange" : isPro ? "border-brand-navy" : "border-line")}>
              <div className={cn("px-5 py-4", isCurrent ? "bg-brand-orange-light" : isPro ? "bg-brand-navy" : "bg-surface-alt")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn("font-heading text-lg font-bold", isPro && !isCurrent ? "text-white" : "text-ink")}>{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={cn("font-heading text-2xl font-bold", isPro && !isCurrent ? "text-white" : "text-ink")}>
                        {plan.price === 0 ? "Free" : formatDT(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className={cn("text-xs", isPro && !isCurrent ? "text-white/60" : "text-muted")}>
                          /{plan.billingCycle === "MONTHLY" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {plan.badge && (
                      <span className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">{plan.badge}</span>
                    )}
                    {isCurrent && (
                      <span className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">Current</span>
                    )}
                  </div>
                </div>
                <div className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", isPro && !isCurrent ? "bg-white/15 text-white" : "bg-brand-orange-light text-brand-orange-dark")}>
                  {Math.round(plan.commissionRate * 100)}% commission per job
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" strokeWidth={2.5} />
                      <span className="text-sm text-ink">{feature}</span>
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <form action={subscribePlanAction} className="mt-4">
                    <input type="hidden" name="planId" value={plan.id} />
                    <Button type="submit" fullWidth size="lg" variant={isPro ? "primary" : "outline"}>
                      {plan.price === 0 ? "Switch to Free" : `Get ${plan.name}`}
                    </Button>
                  </form>
                )}
                {isCurrent && (
                  <p className="mt-4 text-center text-sm font-medium text-success">✓ This is your current plan</p>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-center text-xs text-muted px-4">
          Payment simulation only — no real charges in this version. D17 / Flouci integration available in Phase 2.
        </p>
      </div>
    </div>
  );
}