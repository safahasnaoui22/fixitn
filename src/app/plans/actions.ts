"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { subscribeTechnicianToPlan } from "@/lib/db/monetization";

export async function subscribePlanAction(formData: FormData): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const planId = String(formData.get("planId") ?? "");
  if (!planId) redirect("/plans");

  await subscribeTechnicianToPlan(technician.id, planId);
  redirect("/t/dashboard?plan=updated");
}