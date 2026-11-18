"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import { i18nText } from "@/lib/i18n/translate";
import { createNotification } from "@/lib/db/notifications";
import { approveTechnician, archiveTechnician } from "@/lib/db/technicianApproval";

async function tech(technicianId: string) {
  return prisma.technician.findUnique({
    where: { id: technicianId },
    select: { userId: true, user: { select: { fullName: true } } },
  });
}

export async function warnTechnicianAction(technicianId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const t = await tech(technicianId);
  if (!t) return;
  const message =
    String(formData.get("message") ?? "").trim().slice(0, 300) ||
    i18nText("adminOps.quality.notif.warn.defaultBody");
  await createNotification({
    userId: t.userId,
    type: "STATUS_UPDATE",
    title: i18nText("adminOps.quality.notif.warn.title"),
    body: message,
  });
  await logAudit(actor, {
    action: "technician.warn",
    entityType: "technician",
    entityId: technicianId,
    summary: i18nText("adminOps.quality.audit.warn", { name: t.user.fullName, message }),
  });
  revalidatePath("/admin/quality");
}

export async function suspendTechnicianAction(technicianId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const t = await tech(technicianId);
  if (!t) return;
  await archiveTechnician(technicianId);
  await logAudit(actor, {
    action: "technician.archive",
    entityType: "technician",
    entityId: technicianId,
    summary: i18nText("adminOps.quality.audit.suspend", { name: t.user.fullName }),
  });
  revalidatePath("/admin/quality");
}

export async function reactivateTechnicianAction(technicianId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const t = await tech(technicianId);
  if (!t) return;
  await approveTechnician(technicianId);
  await logAudit(actor, {
    action: "technician.approve",
    entityType: "technician",
    entityId: technicianId,
    summary: i18nText("adminOps.quality.audit.reactivate", { name: t.user.fullName }),
  });
  revalidatePath("/admin/quality");
}

export async function setSeniorAction(technicianId: string, isSenior: boolean): Promise<void> {
  const actor = await requireRole("ADMIN");
  const t = await tech(technicianId);
  if (!t) return;
  const { manuallySetSenior } = await import("@/lib/db/planConfig");
  await manuallySetSenior(technicianId, isSenior);
  await logAudit(actor, {
    action: "technician.senior",
    entityType: "technician",
    entityId: technicianId,
    summary: i18nText(isSenior ? "adminOps.quality.audit.promote" : "adminOps.quality.audit.demote", { name: t.user.fullName }),
  });
  revalidatePath("/admin/quality");
}
