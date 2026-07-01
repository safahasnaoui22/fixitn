import { Crown, Users, CheckCircle2 } from "lucide-react";
import { listAdminPlans } from "@/lib/db/admin";
import { parseStringArray } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { formatDT } from "@/lib/utils";
import { updatePlanAction } from "./actions";

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const plans = await listAdminPlans();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Plans</h1>
        <p className="text-sm text-muted mt-0.5">Edit commission rates and pricing</p>
      </div>

      {success && (
        <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-medium text-success">
          ✓ Plan updated successfully
        </p>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-line bg-surface p-4 text-center">
            <Crown size={20} className={plan.key === "FREE" ? "text-muted mx-auto mb-2" : "text-brand-orange mx-auto mb-2"} />
            <p className="font-heading text-lg font-bold text-ink">{plan.name}</p>
            <p className="text-2xl font-bold text-brand-orange mt-1">
              {plan.price === 0 ? "Free" : formatDT(plan.price)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted">
              <Users size={14} />
              <span>{plan.activeSubscriptions} active</span>
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
              <p className="font-heading text-base font-semibold text-ink">{plan.name}</p>
              <span className="text-xs text-muted">· {plan.billingCycle}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted">
                <Users size={12} />
                {plan.activeSubscriptions} active subscriber{plan.activeSubscriptions !== 1 ? "s" : ""}
              </span>
            </div>

            <form action={updatePlanAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={plan.id} />

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Price (DT)
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={plan.price}
                    disabled={plan.key === "FREE"}
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange disabled:bg-surface-alt disabled:text-muted"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Commission %
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
                    Currently {Math.round(plan.commissionRate * 100)}% per job
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Max requests/mo
                  </label>
                  <input
                    name="maxRequestsPerMonth"
                    type="number"
                    min="0"
                    defaultValue={plan.maxRequestsPerMonth ?? ""}
                    placeholder="0 = unlimited"
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  />
                  <p className="text-[10px] text-muted mt-1">Leave blank for unlimited</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Badge text
                  </label>
                  <input
                    name="badge"
                    defaultValue={plan.badge ?? ""}
                    placeholder='e.g. "Save 34%"'
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Features list (read-only display) */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Features
                </p>
                <ul className="flex flex-col gap-1.5">
                  {parseStringArray(plan.features).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink">
                      <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button type="submit" size="sm">
                  Save {plan.name}
                </Button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}