"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  approveTechnician,
  declineTechnician,
  archiveTechnician,
  updateTechnicianPlan,
} from "@/lib/db/technicianApproval";

export async function approveTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireRole("ADMIN");
  await approveTechnician(technicianId);
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function declineTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireRole("ADMIN");
  await declineTechnician(technicianId);
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function archiveTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireRole("ADMIN");
  await archiveTechnician(technicianId);
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function updateTechnicianPlanAction(
  technicianId: string,
  formData: FormData
): Promise<void> {
  await requireRole("ADMIN");
  const planId = String(formData.get("planId") ?? "").trim();
  await updateTechnicianPlan(technicianId, planId);
  revalidatePath("/admin/technicians");
}