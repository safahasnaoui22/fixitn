"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";
import { getT } from "@/lib/i18n/server";
import { i18nText } from "@/lib/i18n/translate";

export async function updateComplaintAction(formData: FormData): Promise<void> {
  const t = await getT();
  const session = await requirePermission("complaints");
  const reportId = String(formData.get("reportId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 3000);
  if (!reportId || !["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"].includes(status)) {
    throw new Error(t("adminSup.complaints.err.invalidUpdate"));
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, role: true },
  });
  if (!admin || !["ADMIN", "SOUS_ADMIN"].includes(admin.role)) {
    throw new Error(t("adminSup.complaints.err.notAuthorized"));
  }

  const before = await prisma.report.findUnique({
    where: { id: reportId },
    select: { status: true, reporterId: true, reason: true, requestId: true },
  });

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: adminNote || null,
      handledBy: session.userId,
      resolvedAt: status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
    },
  });

  // tell the person who reported when the status changes
  if (before && before.status !== status) {
    await createNotification({
      userId: before.reporterId,
      type: "STATUS_UPDATE",
      title:
        status === "RESOLVED"
          ? i18nText("adminSup.notif.complaintResolved.title")
          : status === "REJECTED"
            ? i18nText("adminSup.notif.complaintRejected.title")
            : i18nText("adminSup.notif.complaintInvestigating.title"),
      body: before.reason,
      requestId: before.requestId,
    }).catch(() => undefined);
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      actorName: admin.fullName,
      actorRole: admin.role,
      action: "complaint.update",
      entityType: "report",
      entityId: reportId,
      summary: i18nText("sys.audit.complaintStatus", { status }),
    },
  }).catch(() => undefined);

  revalidatePath("/admin/complaints");
  revalidatePath(`/admin/complaints/${reportId}`);
}

export async function moderateConversationAction(formData: FormData): Promise<void> {
  const t = await getT();
  const session = await requirePermission("complaints");
  const requestId = String(formData.get("requestId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!requestId || !["RESTRICT", "RESTORE"].includes(mode)) {
    throw new Error(t("adminSup.complaints.err.invalidModeration"));
  }
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });
  if (!request) throw new Error(t("adminSup.complaints.err.requestNotFound"));

  if (mode === "RESTRICT") {
    await prisma.chatRestriction.upsert({
      where: { requestId },
      create: { requestId, active: true, reason: reason || i18nText("sys.audit.chatRestricted"), createdBy: session.userId },
      update: { active: true, reason: reason || i18nText("sys.audit.chatRestricted"), createdBy: session.userId },
    });
  } else {
    await prisma.chatRestriction.updateMany({
      where: { requestId },
      data: { active: false, reason: reason || i18nText("sys.audit.chatRestrictionLifted"), createdBy: session.userId },
    });
  }
  revalidatePath("/admin/complaints");
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (reportId) revalidatePath(`/admin/complaints/${reportId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/chat`);
}
