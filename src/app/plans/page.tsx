import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft, Check, Crown, ShieldCheck,
  Star, TrendingUp, Lock,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import { getPlanConfig } from "@/lib/db/planConfig";
import { getRatingBreakdown } from "@/lib/db/reviews";
import { SeniorBadge } from "@/components/SeniorBadge";
import { formatDT } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function PlansPage() {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [plans, config, breakdown] = await Promise.all([
    listPlans(),
    getPlanConfig(),
    getRatingBreakdown(technician.id),
  ]);

  const beginner = plans.find((p) => p.key === "BEGINNER");
  const seniorPro = plans.find((p) => p.key === "SENIOR_PRO");

  // Progress toward Senior Pro
  const fiveStarCount = breakdown.counts[5] ?? 0;
  const fourPlusCount =
    (breakdown.counts[4] ?? 0) + (breakdown.counts[5] ?? 0);
  const avgRating = breakdown.avg ?? 0;
  const totalReviews = breakdown.total;

  // Gate check
  const gateReached = totalReviews >= config.minTotalReviews;

  // Route 1 progress
  const route1Progress = Math.min(
    Math.round((fiveStarCount / config.minFiveStarCount) * 100),
    100
  );
  // Route 2 progress (average of two conditions)
  const avgProgress = Math.min(
    Math.round((avgRating / config.minAverageRating) * 100),
    100
  );
  const fourPlusProgress = Math.min(
    Math.round((fourPlusCount / config.minFourStarCount) * 100),
    100
  );
  const route2Progress = Math.round((avgProgress + fourPlusProgress) / 2);

  return (
    <div className="app-content no-scrollbar">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href="/t/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">
            My Plan
          </p>
          <p className="text-xs text-muted">
            {technician.isSenior ? "Senior Pro" : "Beginner"}
          </p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">

        {/* Current status banner */}
        {technician.isSenior ? (
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={22} />
              <p className="font-heading text-lg font-bold">Senior Pro</p>
            </div>
            <p className="text-sm text-white/80">
              You are at the top of your game. Clients see you first and
              you keep more of every job.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-brand-navy p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={20} className="text-white/60" />
              <p className="font-heading text-base font-bold">
                Beginner Plan
              </p>
            </div>
            <p className="text-sm text-white/70">
              Complete jobs and earn great reviews to automatically unlock
              Senior Pro.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="flex flex-col gap-4">

          {/* Beginner card */}
          {beginner && (
            <div
              className={cn(
                "rounded-2xl border-2 bg-surface overflow-hidden",
                !technician.isSenior ? "border-brand-orange" : "border-line"
              )}
            >
              <div
                className={cn(
                  "px-5 py-4",
                  !technician.isSenior ? "bg-brand-orange-light" : "bg-surface-alt"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-lg font-bold text-ink">
                      Beginner
                    </p>
                    <p className="text-sm text-muted">Auto-assigned on registration</p>
                  </div>
                  {!technician.isSenior && (
                    <span className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange-dark">
                  {Math.round((beginner.commissionRate) * 100)}% commission per job
                </div>
              </div>
              <div className="px-5 py-4">
                <ul className="flex flex-col gap-2.5">
                  {beginner.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" strokeWidth={2.5} />
                      <span className="text-sm text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Senior Pro card */}
          {seniorPro && (
            <div
              className={cn(
                "rounded-2xl border-2 overflow-hidden",
                technician.isSenior
                  ? "border-amber-400 bg-surface"
                  : "border-line bg-surface"
              )}
            >
              <div
                className={cn(
                  "px-5 py-4",
                  technician.isSenior
                    ? "bg-gradient-to-r from-amber-50 to-amber-100"
                    : "bg-surface-alt"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-lg font-bold text-ink">
                        Senior Pro
                      </p>
                      {technician.isSenior && <SeniorBadge size="sm" />}
                    </div>
                    <p className="text-sm text-muted mt-0.5">
                      Auto-granted when criteria met
                    </p>
                  </div>
                  {technician.isSenior && (
                    <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shrink-0">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1.5 text-xs font-semibold text-success">
                  Only {Math.round((seniorPro.commissionRate) * 100)}% commission per job
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="flex flex-col gap-2.5 mb-4">
                  {seniorPro.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" strokeWidth={2.5} />
                      <span className="text-sm text-ink">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Not yet Senior — show progress */}
                {!technician.isSenior && (
                  <div className="rounded-2xl border border-line bg-surface-alt p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-muted shrink-0" />
                      <p className="text-sm font-semibold text-ink">
                        Your progress toward Senior Pro
                      </p>
                    </div>

                    {/* Gate */}
                    <ProgressBar
                      label={`Minimum reviews gate`}
                      sublabel={`${totalReviews} / ${config.minTotalReviews} reviews`}
                      value={Math.min(Math.round((totalReviews / config.minTotalReviews) * 100), 100)}
                      done={gateReached}
                      color="bg-brand-navy"
                    />

                    {!gateReached && (
                      <p className="text-xs text-amber-600 -mt-2">
                        Get {config.minTotalReviews - totalReviews} more reviews to unlock promotion checks.
                      </p>
                    )}

                    <div className={cn("flex flex-col gap-4", !gateReached && "opacity-40 pointer-events-none")}>
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                          Route 1 — Five-star count
                        </p>
                        <ProgressBar
                          label="5-star reviews"
                          sublabel={`${fiveStarCount} / ${config.minFiveStarCount} needed`}
                          value={route1Progress}
                          done={fiveStarCount >= config.minFiveStarCount}
                          color="bg-amber-400"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-line" />
                        <span className="text-xs font-bold text-muted">OR</span>
                        <div className="flex-1 h-px bg-line" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                          Route 2 — Average rating
                        </p>
                        <div className="flex flex-col gap-2">
                          <ProgressBar
                            label="Average rating"
                            sublabel={`${avgRating.toFixed(1)} / ${config.minAverageRating}★ needed`}
                            value={avgProgress}
                            done={avgRating >= config.minAverageRating}
                            color="bg-success"
                          />
                          <ProgressBar
                            label="Reviews rated 4+"
                            sublabel={`${fourPlusCount} / ${config.minFourStarCount} needed`}
                            value={fourPlusProgress}
                            done={fourPlusCount >= config.minFourStarCount}
                            color="bg-success"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted text-center">
                      Promotion is automatic — keep getting great reviews and
                      you&apos;ll be notified when you qualify.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How commission works */}
        <div className="rounded-2xl bg-brand-navy px-4 py-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-brand-orange" />
            <p className="font-heading text-sm font-semibold">
              How commission works
            </p>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            FixiTN takes a small percentage of each completed job. Senior Pro
            technicians pay significantly less commission, meaning more money
            in your pocket for every job you complete.
          </p>
          {beginner && seniorPro && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 px-3 py-2.5 text-center">
                <p className="text-xs text-white/60">Beginner</p>
                <p className="font-heading text-lg font-bold">
                  {Math.round(beginner.commissionRate * 100)}%
                </p>
              </div>
              <div className="rounded-xl bg-amber-400/20 px-3 py-2.5 text-center border border-amber-400/30">
                <p className="text-xs text-amber-300">Senior Pro</p>
                <p className="font-heading text-lg font-bold text-amber-300">
                  {Math.round(seniorPro.commissionRate * 100)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  sublabel,
  value,
  done,
  color,
}: {
  label: string;
  sublabel: string;
  value: number;
  done: boolean;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {done && (
            <Check size={12} className="text-success" strokeWidth={3} />
          )}
          <p className="text-xs font-medium text-ink">{label}</p>
        </div>
        <p className="text-xs text-muted">{sublabel}</p>
      </div>
      <div className="h-2 w-full rounded-full bg-line overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}