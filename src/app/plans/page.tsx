import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft, Check, Crown, MapPin,
  ShieldCheck, TrendingUp, CheckCircle2,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import { getPlanConfig } from "@/lib/db/planConfig";
import { getRatingBreakdown } from "@/lib/db/reviews";
import { SeniorBadge } from "@/components/SeniorBadge";
import { Button } from "@/components/ui/Button";
import { formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { tDb, tOr } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";
import { PLAN_RADIUS } from "@/lib/constants";
import { subscribePlanAction } from "./actions";
import type { PlanKey } from "@/lib/constants";

const PLAN_STYLE: Record<string, {
  headerBg: string;
  border: string;
  badge?: string;
}> = {
  FREE:     { headerBg: "bg-surface-alt", border: "border-line" },
  BEGINNER: { headerBg: "bg-blue-50",     border: "border-blue-200" },
  PRO:      { headerBg: "bg-brand-navy",  border: "border-brand-navy", badge: "booking.plans.mostPopular" },
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
  const { success } = await searchParams;
  const t = await getT();
  const locale = await getLocale();

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [plans, config, breakdown] = await Promise.all([
    listPlans(),
    getPlanConfig(),
    getRatingBreakdown(technician.id),
  ]);

  const currentPlanId = technician.planId;
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const currentPlanKey = (currentPlan?.key ?? "BEGINNER") as PlanKey;

  // Senior Pro progress
  const fiveStarCount = breakdown.counts[5] ?? 0;
  const fourPlusCount = (breakdown.counts[4] ?? 0) + (breakdown.counts[5] ?? 0);
  const avgRating = breakdown.avg ?? 0;
  const totalReviews = breakdown.total;
  const gateReached = totalReviews >= config.minTotalReviews;
  const route1Done = fiveStarCount >= config.minFiveStarCount;
  const route2Done = avgRating >= config.minAverageRating && fourPlusCount >= config.minFourStarCount;
  const qualifiesForSenior = gateReached && (route1Done || route2Done);

  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href="/t/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">
            {t("booking.plans.title")}
          </p>
          <p className="text-xs text-muted">
            {t("booking.plans.current", { name: currentPlan ? tOr(t, `plan.${currentPlan.key}`, currentPlan.name) : t("plan.BEGINNER") })}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <p className="text-sm font-medium text-success">
              {t("booking.plans.updated")}
            </p>
          </div>
        )}

        {/* Senior Pro status */}
        {technician.isSenior && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} />
              <SeniorBadge size="sm" />
            </div>
            <p className="text-sm text-white/80 mt-1">
              {t("booking.plans.seniorYou")}
            </p>
          </div>
        )}

        {/* Plan cards */}
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const style = PLAN_STYLE[plan.key] ?? PLAN_STYLE.FREE;
          const isPro = plan.key === "PRO";
          const radius = plan.radiusKm;

       
          const features = plan.features;
          const planName = tOr(t, `plan.${plan.key}`, plan.name);
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border-2 bg-surface overflow-hidden",
                isCurrent ? "border-brand-orange" : style.border
              )}
            >
              {/* Card header */}
              <div
                className={cn(
                  "px-5 py-4",
                  isCurrent ? "bg-brand-orange-light" : style.headerBg
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "font-heading text-xl font-bold",
                          isPro && !isCurrent ? "text-white" : "text-ink"
                        )}
                      >
                        {planName}
                      </p>
                      {plan.badge && !isCurrent && (
                        <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white">
                          {tDb(t, "planBadge", plan.badge)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={cn(
                          "font-heading text-2xl font-bold",
                          isPro && !isCurrent ? "text-white" : "text-ink"
                        )}
                      >
                        {plan.price === 0 ? t("common.free") : formatDT(plan.price, locale)}
                      </span>
                      {plan.price > 0 && (
                        <span
                          className={cn(
                            "text-xs",
                            isPro && !isCurrent ? "text-white/60" : "text-muted"
                          )}
                        >
                          {t("booking.plans.perMonthShort")}
                        </span>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white shrink-0">
                      {t("booking.plans.currentBadge")}
                    </span>
                  )}
                </div>

                {/* Key metrics row */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2",
                      isPro && !isCurrent ? "bg-white/10" : "bg-white/60"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px]",
                        isPro && !isCurrent ? "text-white/60" : "text-muted"
                      )}
                    >
                      {t("booking.plans.commission")}
                    </p>
                    <p
                      className={cn(
                        "font-heading text-base font-bold",
                        isPro && !isCurrent ? "text-white" : "text-ink"
                      )}
                    >
                      {Math.round(plan.commissionRate * 100)}%
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2",
                      isPro && !isCurrent ? "bg-white/10" : "bg-white/60"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px]",
                        isPro && !isCurrent ? "text-white/60" : "text-muted"
                      )}
                    >
                      <MapPin size={9} />
                      {t("booking.plans.radius")}
                    </div>
                    <p
                      className={cn(
                        "font-heading text-base font-bold",
                        isPro && !isCurrent ? "text-white" : "text-ink"
                      )}
                    >
                      {radius} {t("common.km")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="px-5 py-4">
                <ul className="flex flex-col gap-2.5 mb-4">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-success"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-ink">{tDb(t, "planFeature", f)}</span>
                    </li>
                  ))}
                </ul>

                {/* Max requests note */}
                {plan.maxRequestsPerMonth != null && (
                  <p className="text-xs text-muted mb-3">
                    {t("booking.plans.limited", { n: plan.maxRequestsPerMonth })}
                  </p>
                )}

                {/* Action button */}
                {isCurrent ? (
                  <p className="text-center text-sm font-medium text-success py-2">
                    {t("booking.plans.yourCurrent")}
                  </p>
                ) : (
                  <form action={subscribePlanAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      variant={isPro ? "primary" : "outline"}
                    >
                      {plan.price === 0
                        ? t("booking.plans.switchTo", { name: planName })
                        : t("booking.plans.upgradeTo", { name: planName })}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {/* Senior Pro progress */}
        {!technician.isSenior && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={16} className="text-amber-600" />
              <p className="font-heading text-sm font-semibold text-amber-800">
                {t("booking.plans.earnTitle")}
              </p>
            </div>
            <p className="text-xs text-amber-700 mb-3 leading-relaxed">
              {t("booking.plans.earnDesc")}
            </p>

            {/* Gate */}
            <ProgressItem
              label={t("booking.plans.gate", { n: totalReviews, min: config.minTotalReviews })}
              done={gateReached}
              pct={Math.min((totalReviews / config.minTotalReviews) * 100, 100)}
            />

            <div className={cn("mt-2 flex flex-col gap-2", !gateReached && "opacity-40 pointer-events-none")}>
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                {t("booking.plans.thenMeet")}
              </p>
              <ProgressItem
                label={t("booking.plans.route1", { n: fiveStarCount, min: config.minFiveStarCount })}
                done={route1Done}
                pct={Math.min((fiveStarCount / config.minFiveStarCount) * 100, 100)}
              />
              <p className="text-[10px] text-amber-600 text-center">{t("booking.plans.or")}</p>
              <ProgressItem
                label={t("booking.plans.route2", { avg: avgRating.toFixed(1), minAvg: config.minAverageRating, n: fourPlusCount, min: config.minFourStarCount })}
                done={route2Done}
                pct={Math.min(((avgRating / config.minAverageRating) * 50 + (fourPlusCount / config.minFourStarCount) * 50), 100)}
              />
            </div>

            {qualifiesForSenior && (
              <p className="mt-3 text-xs font-semibold text-success text-center">
                {t("booking.plans.qualify")}
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted px-4">
          {t("booking.plans.billingNote")}
        </p>
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  done,
  pct,
}: {
  label: string;
  done: boolean;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {done && <Check size={11} className="text-success" strokeWidth={3} />}
          <p className="text-xs text-amber-800">{label}</p>
        </div>
        <span className="text-[10px] text-amber-600 font-semibold">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-amber-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}