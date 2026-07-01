"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { updateAdminPlan } from "@/lib/db/admin";

export async function updatePlanAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const commissionRate = Number(formData.get("commissionRate") ?? 0.15) / 100;
  const maxRaw = String(formData.get("maxRequestsPerMonth") ?? "").trim();
  const maxRequestsPerMonth = maxRaw === "" || maxRaw === "0" ? null : Number(maxRaw);
  const badge = String(formData.get("badge") ?? "").trim() || null;
  if (!id) redirect("/admin/plans");
  await updateAdminPlan(id, { price, commissionRate, maxRequestsPerMonth, badge });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?success=1");
}