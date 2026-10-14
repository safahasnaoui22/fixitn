"use server";

import { redirect } from "next/navigation";
import { requireRole, requirePermission } from "@/lib/auth";
import { setTechnicianVerified, deleteUser } from "@/lib/db/admin";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";

async function techName(technicianId: string): Promise<string> {
  const t = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { user: { select: { fullName: true } } },
  });
  return t?.user.fullName ?? "";
}

export async function verifyTechnicianAction(technicianId: string, verified: boolean): Promise<void> {
  const actor = await requirePermission("technicians");
  await setTechnicianVerified(technicianId, verified);
  await logAudit(actor, {
    action: "technician.verify",
    entityType: "technician",
    entityId: technicianId,
    summary: `${verified ? "Verified" : "Un-verified"} technician ${await techName(technicianId)}`,
  });
  redirect(`/admin/technicians/${technicianId}`);
}

// Deleting a user is destructive: ADMIN only, never grantable.
export async function deleteUserAction(userId: string): Promise<void> {
  await requireRole("ADMIN");
  await deleteUser(userId);
  redirect("/admin/users");
}

export async function promoteSeniorAction(
  technicianId: string,
  isSenior: boolean
): Promise<void> {
  const actor = await requirePermission("technicians");
  const { manuallySetSenior } = await import("@/lib/db/planConfig");
  await manuallySetSenior(technicianId, isSenior);
  await logAudit(actor, {
    action: "technician.senior",
    entityType: "technician",
    entityId: technicianId,
    summary: `${isSenior ? "Promoted to senior" : "Removed senior status of"} technician ${await techName(technicianId)}`,
  });
  redirect(`/admin/technicians/${technicianId}`);
}

export async function resetFaceAction(userId: string): Promise<void> {
  const actor = await requirePermission("users");
  const { resetFaceDescriptor } = await import("@/lib/db/face");
  await resetFaceDescriptor(userId);
  await logAudit(actor, {
    action: "user.resetFace",
    entityType: "user",
    entityId: userId,
    summary: "Reset face ID",
  });
  redirect(`/admin/users/${userId}?success=face-reset`);
}
