import Link from "next/link";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { getPlanConfig } from "@/lib/db/planConfig";
import { Button } from "@/components/ui/Button";
import { updatePlanConfigAction } from "./actions";
import { prisma } from "@/lib/db/client";

async function getSeniorStats() {
  const [total, seniors, eligible] = await Promise.all([
    prisma.technician.count(),
    prisma.technician.count({ where: { isSenior: true } }),
    prisma.technician.count({ where: { isSenior: false } }),
  ]);
  return { total, seniors, nonSeniors: eligible };
}

export default async function PlanConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const [config, stats] = await Promise.all([getPlanConfig(), getSeniorStats()]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Senior Pro Criteria
          </h1>
          <p className="text-sm text-muted">
            Configure when a technician is automatically promoted
          </p>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            Criteria updated — new reviews will be evaluated against these
            thresholds automatically.
          </p>
        </div>
      )}
      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <p className="font-heading text-2xl font-bold text-ink">
            {stats.total}
          </p>
          <p className="text-xs text-muted mt-0.5">Total technicians</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShieldCheck size={14} className="text-amber-500" />
            <p className="font-heading text-2xl font-bold text-ink">
              {stats.seniors}
            </p>
          </div>
          <p className="text-xs text-muted">Senior Pro</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <p className="font-heading text-2xl font-bold text-ink">
            {stats.nonSeniors}
          </p>
          <p className="text-xs text-muted mt-0.5">Beginner</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info size={15} className="text-blue-500 shrink-0" />
          <p className="text-sm font-semibold text-blue-800">
            How automatic promotion works
          </p>
        </div>
        <p className="text-sm text-blue-700 leading-relaxed mb-2">
          After every review, FixiTN automatically checks if the technician
          qualifies for Senior Pro. They must first pass the{" "}
          <strong>minimum reviews</strong> gate, then satisfy{" "}
          <strong>either</strong> of the two routes below:
        </p>
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-white/60 px-3 py-2">
            <p className="text-xs font-semibold text-blue-800">
              Route 1 — Five-star count
            </p>
            <p className="text-xs text-blue-700">
              Technician has received at least{" "}
              <strong>{config.minFiveStarCount}</strong> five-star reviews.
            </p>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-2">
            <p className="text-xs font-semibold text-blue-800">
              Route 2 — Average rating
            </p>
            <p className="text-xs text-blue-700">
              Average rating ≥ <strong>{config.minAverageRating}</strong> AND
              at least <strong>{config.minFourStarCount}</strong> reviews rated
              4 or higher.
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2 font-medium">
          Both routes require a minimum of{" "}
          <strong>{config.minTotalReviews}</strong> total reviews first.
        </p>
      </div>

      {/* Config form */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-base font-semibold text-ink mb-5">
          Edit Criteria
        </p>

        <form action={updatePlanConfigAction} className="flex flex-col gap-5">
          {/* Gate */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-white text-xs font-bold">
                G
              </div>
              <p className="text-sm font-semibold text-ink">
                Minimum total reviews gate
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                Technician must have at least this many reviews total
              </label>
              <input
                name="minTotalReviews"
                type="number"
                min={1}
                max={200}
                required
                defaultValue={config.minTotalReviews}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
              />
              <p className="mt-1 text-xs text-muted">
                Currently: {config.minTotalReviews} reviews
              </p>
            </div>
          </div>

          <div className="h-px bg-line" />

          {/* Route 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <p className="text-sm font-semibold text-ink">
                Route 1 — Five-star count
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                Minimum number of 5-star reviews
              </label>
              <input
                name="minFiveStarCount"
                type="number"
                min={1}
                max={200}
                required
                defaultValue={config.minFiveStarCount}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
              />
              <p className="mt-1 text-xs text-muted">
                Currently: {config.minFiveStarCount} five-star reviews
              </p>
            </div>
          </div>

          <div className="h-px bg-line" />

          {/* Route 2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-success" />
              <p className="text-sm font-semibold text-ink">
                Route 2 — Average rating
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-ink">
                  Minimum average rating (1.0 – 5.0)
                </label>
                <input
                  name="minAverageRating"
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  required
                  defaultValue={config.minAverageRating}
                  className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
                />
                <p className="mt-1 text-xs text-muted">
                  Currently: {config.minAverageRating}★
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">
                  Minimum number of reviews rated 4 or higher
                </label>
                <input
                  name="minFourStarCount"
                  type="number"
                  min={1}
                  max={200}
                  required
                  defaultValue={config.minFourStarCount}
                  className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
                />
                <p className="mt-1 text-xs text-muted">
                  Currently: {config.minFourStarCount} reviews ≥ 4 stars
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg">
            <CheckCircle2 size={18} />
            Save Criteria
          </Button>
        </form>
      </div>

      {/* Warning */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          Important
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          Changing these criteria does <strong>not</strong> retroactively
          demote existing Senior Pro technicians. It only affects future
          promotions. To manually demote a technician, visit their profile
          in the Technicians section.
        </p>
      </div>
    </div>
  );
}