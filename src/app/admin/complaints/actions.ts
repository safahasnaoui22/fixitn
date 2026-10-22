"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export async function updateComplaintAction(formData: FormData): Promise<void> {
  const session = await requirePermission("complaints");
  const reportId = String(formData.get("reportId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 3000);
  if (!reportId || !["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"].includes(status)) {
    throw new Error("Invalid complaint update.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, role: true },
  });
  if (!admin || !["ADMIN", "SOUS_ADMIN"].includes(admin.role)) {
    throw new Error("Not authorized.");
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: adminNote || null,
      handledBy: session.userId,
      resolvedAt: status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      actorName: admin.fullName,
      actorRole: admin.role,
      action: "complaint.update",
      entityType: "report",
      entityId: reportId,
      summary: `Updated complaint status to ${status}`,
    },
  }).catch(() => undefined);

  revalidatePath("/admin/complaints");
}

export async function moderateConversationAction(formData: FormData): Promise<void> {
  const session = await requirePermission("complaints");
  const requestId = String(formData.get("requestId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!requestId || !["RESTRICT", "RESTORE"].includes(mode)) {
    throw new Error("Invalid conversation moderation request.");
  }
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });
  if (!request) throw new Error("Request not found.");

  if (mode === "RESTRICT") {
    await prisma.chatRestriction.upsert({
      where: { requestId },
      create: { requestId, active: true, reason: reason || "Restricted after complaint review.", createdBy: session.userId },
      update: { active: true, reason: reason || "Restricted after complaint review.", createdBy: session.userId },
    });
  } else {
    await prisma.chatRestriction.updateMany({
      where: { requestId },
      data: { active: false, reason: reason || "Restriction lifted after review.", createdBy: session.userId },
    });
  }
  revalidatePath("/admin/complaints");
  revalidatePath(`/requests/${requestId}/chat`);
}
