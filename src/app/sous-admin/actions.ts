"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  approveTechnician,
  declineTechnician,
  archiveTechnician,
  updateTechnicianPlan,
} from "@/lib/db/technicianApproval";

async function requireSousAdminOrAdmin() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SOUS_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect("/login");
  }
  return session;
}

export async function approveTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireSousAdminOrAdmin();
  await approveTechnician(technicianId);
  revalidatePath("/sous-admin/technicians");
  revalidatePath("/sous-admin");
}

export async function declineTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireSousAdminOrAdmin();
  await declineTechnician(technicianId);
  revalidatePath("/sous-admin/technicians");
  revalidatePath("/sous-admin");
}

export async function archiveTechnicianAction(
  technicianId: string
): Promise<void> {
  await requireSousAdminOrAdmin();
  await archiveTechnician(technicianId);
  revalidatePath("/sous-admin/technicians");
  revalidatePath("/sous-admin");
}

export async function updateTechnicianPlanAction(
  technicianId: string,
  formData: FormData
): Promise<void> {
  await requireSousAdminOrAdmin();
  const planId = String(formData.get("planId") ?? "").trim();
  await updateTechnicianPlan(technicianId, planId);
  revalidatePath("/sous-admin/technicians");
}