"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import {
  approveTechnician,
  declineTechnician,
  archiveTechnician,
  updateTechnicianPlan,
} from "@/lib/db/technicianApproval";

async function techName(technicianId: string): Promise<string> {
  const t = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { user: { select: { fullName: true } } },
  });
  return t?.user.fullName ?? "";
}

export async function approveTechnicianAction(
  technicianId: string
): Promise<void> {
  const actor = await requirePermission("technicians");
  await approveTechnician(technicianId);
  await logAudit(actor, {
    action: "technician.approve",
    entityType: "technician",
    entityId: technicianId,
    summary: `Approved technician ${await techName(technicianId)}`,
  });
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function declineTechnicianAction(
  technicianId: string
): Promise<void> {
  const actor = await requirePermission("technicians");
  await declineTechnician(technicianId);
  await logAudit(actor, {
    action: "technician.decline",
    entityType: "technician",
    entityId: technicianId,
    summary: `Declined technician ${await techName(technicianId)}`,
  });
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function archiveTechnicianAction(
  technicianId: string
): Promise<void> {
  const actor = await requirePermission("technicians");
  await archiveTechnician(technicianId);
  await logAudit(actor, {
    action: "technician.archive",
    entityType: "technician",
    entityId: technicianId,
    summary: `Archived technician ${await techName(technicianId)}`,
  });
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function updateTechnicianPlanAction(
  technicianId: string,
  formData: FormData
): Promise<void> {
  const actor = await requirePermission("technicians");
  const planId = String(formData.get("planId") ?? "").trim();
  await updateTechnicianPlan(technicianId, planId);
  await logAudit(actor, {
    action: "technician.plan",
    entityType: "technician",
    entityId: technicianId,
    summary: `Changed plan of technician ${await techName(technicianId)}`,
  });
  revalidatePath("/admin/technicians");
}