import { ModifiedBy } from "@/components/ModifiedBy";
import { getLastChanges } from "@/lib/db/audit";
import { requirePermission } from "@/lib/auth";
import { Crown, Users, CheckCircle2 } from "lucide-react";
import { listAdminPlans } from "@/lib/db/admin";
import { parseStringArray } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { tOr, tDb } from "@/lib/i18n/translate";
import { updatePlanAction } from "./actions";

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  await requirePermission("plans");
  const t = await getT();
  const locale = await getLocale();
  const { success } = await searchParams;
  const plans = await listAdminPlans();
  const lastChanges = await getLastChanges("plan", plans.map((pl) => pl.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.plans.title")}</h1>
        <p className="text-sm text-muted mt-0.5">{t("adminOps.plans.subtitle")}</p>
      </div>

      {success && (
        <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
          ✓ {t("adminOps.plans.updated")}
        </p>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-line bg-surface p-4 text-center">
            <Crown size={20} className={plan.key === "FREE" ? "text-muted mx-auto mb-2" : "text-brand-orange mx-auto mb-2"} />
            <p className="font-heading text-lg font-bold text-ink">{tOr(t, `plan.${plan.key}`, plan.name)}</p>
            <p className="text-2xl font-bold text-brand-orange mt-1">
              {plan.price === 0 ? t("common.free") : formatDT(plan.price, locale)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted">
              <Users size={14} />
              <span>{t("adminOps.plans.activeCount", { n: plan.activeSubscriptions })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit forms */}
      <div className="flex flex-col gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 mb-5">
              <Crown size={16} className={plan.key === "FREE" ? "text-muted" : "text-brand-orange"} />
              <p className="font-heading text-base font-semibold text-ink">{tOr(t, `plan.${plan.key}`, plan.name)}</p>
              <span className="text-xs text-muted">· {tOr(t, `billingCycle.${plan.billingCycle}`, plan.billingCycle)}</span>
              <span className="ms-auto flex items-center gap-1.5 text-xs text-muted">
                <Users size={12} />
                {plan.activeSubscriptions === 1 ? t("adminOps.plans.subscriberOne") : t("adminOps.plans.subscriberMany", { n: plan.activeSubscriptions })}
              </span>
            </div>

            <ModifiedBy change={lastChanges.get(plan.id)} />

            <form action={updatePlanAction} className="mt-3 flex flex-col gap-4">
              <input type="hidden" name="id" value={plan.id} />

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("adminOps.plans.priceDt")}
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={plan.price}
                    disabled={plan.key === "FREE"}
                    dir="ltr" className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm text-start outline-none focus:border-brand-orange disabled:bg-surface-alt disabled:text-muted"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("adminOps.plans.commissionPct")}
                  </label>
                  <input
                    name="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    defaultValue={Math.round(plan.commissionRate * 100)}
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    {t("adminOps.plans.currentCommission", { n: Math.round(plan.commissionRate * 100) })}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("adminOps.plans.maxRequests")}
                  </label>
                  <input
                    name="maxRequestsPerMonth"
                    type="number"
                    min="0"
                    defaultValue={plan.maxRequestsPerMonth ?? ""}
                    placeholder={t("adminOps.plans.unlimitedPh")}
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  />
                  <p className="text-[10px] text-muted mt-1">{t("adminOps.plans.unlimitedHint")}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("adminOps.plans.badgeText")}
                  </label>
                  <input
                    name="badge"
                    defaultValue={plan.badge ?? ""}
                    placeholder={t("adminOps.plans.badgePh")}
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Features list (read-only display) */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  {t("adminOps.plans.features")}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {parseStringArray(plan.features).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink">
                      <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                      {tDb(t, "planFeature", f)}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button type="submit" size="sm">
                  {t("adminOps.plans.saveNamed", { name: tOr(t, `plan.${plan.key}`, plan.name) })}
                </Button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}