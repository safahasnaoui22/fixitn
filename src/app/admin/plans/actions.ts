"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { updateAdminPlan } from "@/lib/db/admin";

export async function updatePlanAction(formData: FormData) {
  const actor = await requirePermission("plans");
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const commissionRate = Number(formData.get("commissionRate") ?? 0.15) / 100;
  const maxRaw = String(formData.get("maxRequestsPerMonth") ?? "").trim();
  const maxRequestsPerMonth = maxRaw === "" || maxRaw === "0" ? null : Number(maxRaw);
  const badge = String(formData.get("badge") ?? "").trim() || null;
  if (!id) redirect("/admin/plans");
  await updateAdminPlan(id, { price, commissionRate, maxRequestsPerMonth, badge });
  await logAudit(actor, {
    action: "plan.update",
    entityType: "plan",
    entityId: id,
    summary: `Updated plan (price ${price} DT, commission ${(commissionRate * 100).toFixed(0)}%)`,
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?success=1");
}