import { requireRole } from "@/lib/auth";
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
import { getT } from "@/lib/i18n/server";

function rich(s: string) {
  return s.split(/<b>(.*?)<\/b>/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

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
  await requireRole("ADMIN");
  const t = await getT();
  const { error, success } = await searchParams;
  const [config, stats] = await Promise.all([getPlanConfig(), getSeniorStats()]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            {t("adminOps.planConfig.title")}
          </h1>
          <p className="text-sm text-muted">
            {t("adminOps.planConfig.subtitle")}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            {t("adminOps.planConfig.updated")}
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
          <p className="text-xs text-muted mt-0.5">{t("adminOps.planConfig.totalTechs")}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShieldCheck size={14} className="text-amber-500" />
            <p className="font-heading text-2xl font-bold text-ink">
              {stats.seniors}
            </p>
          </div>
          <p className="text-xs text-muted">{t("adminOps.planConfig.seniorPro")}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <p className="font-heading text-2xl font-bold text-ink">
            {stats.nonSeniors}
          </p>
          <p className="text-xs text-muted mt-0.5">{t("adminOps.planConfig.beginner")}</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info size={15} className="text-blue-500 shrink-0" />
          <p className="text-sm font-semibold text-blue-800">
            {t("adminOps.planConfig.howTitle")}
          </p>
        </div>
        <p className="text-sm text-blue-700 leading-relaxed mb-2">
          {rich(t("adminOps.planConfig.howIntro"))}
        </p>
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-white/60 px-3 py-2">
            <p className="text-xs font-semibold text-blue-800">
              {t("adminOps.planConfig.route1")}
            </p>
            <p className="text-xs text-blue-700">
              {rich(t("adminOps.planConfig.route1Desc", { n: config.minFiveStarCount }))}
            </p>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-2">
            <p className="text-xs font-semibold text-blue-800">
              {t("adminOps.planConfig.route2")}
            </p>
            <p className="text-xs text-blue-700">
              {rich(t("adminOps.planConfig.route2Desc", { avg: config.minAverageRating, n: config.minFourStarCount }))}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2 font-medium">
          {rich(t("adminOps.planConfig.bothRoutes", { n: config.minTotalReviews }))}
        </p>
      </div>

      {/* Config form */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-base font-semibold text-ink mb-5">
          {t("adminOps.planConfig.editTitle")}
        </p>

        <form action={updatePlanConfigAction} className="flex flex-col gap-5">
          {/* Gate */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-white text-xs font-bold">
                G
              </div>
              <p className="text-sm font-semibold text-ink">
                {t("adminOps.planConfig.gate")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                {t("adminOps.planConfig.gateLabel")}
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
                {t("adminOps.planConfig.currentReviews", { n: config.minTotalReviews })}
              </p>
            </div>
          </div>

          <div className="h-px bg-line" />

          {/* Route 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <p className="text-sm font-semibold text-ink">
                {t("adminOps.planConfig.route1")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                {t("adminOps.planConfig.minFive")}
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
                {t("adminOps.planConfig.currentFive", { n: config.minFiveStarCount })}
              </p>
            </div>
          </div>

          <div className="h-px bg-line" />

          {/* Route 2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-success" />
              <p className="text-sm font-semibold text-ink">
                {t("adminOps.planConfig.route2")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-ink">
                  {t("adminOps.planConfig.minAvg")}
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
                  {t("adminOps.planConfig.currentAvg", { n: config.minAverageRating })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">
                  {t("adminOps.planConfig.minFour")}
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
                  {t("adminOps.planConfig.currentFour", { n: config.minFourStarCount })}
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg">
            <CheckCircle2 size={18} />
            {t("adminOps.planConfig.save")}
          </Button>
        </form>
      </div>

      {/* Warning */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          {t("adminOps.planConfig.important")}
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          {rich(t("adminOps.planConfig.warning"))}
        </p>
      </div>
    </div>
  );
}