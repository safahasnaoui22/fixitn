"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

const STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED"];

export async function updateReportAction(reportId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 2000);
  if (!STATUSES.includes(status)) return;

  const before = await prisma.report.findUnique({ where: { id: reportId } });
  if (!before) return;

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: adminNote || null,
      handledBy: actor.fullName,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });

  await logAudit(actor, {
    action: "report.update",
    entityType: "request",
    entityId: before.requestId ?? reportId,
    summary: `Report from ${before.reporterName} set to ${status}`,
  });

  // tell the person who reported when it changes
  if (before.status !== status) {
    await createNotification({
      userId: before.reporterId,
      type: "STATUS_UPDATE",
      title: status === "RESOLVED" ? "✅ Your report was resolved" : "🔎 We are looking at your report",
      body: adminNote || before.reason,
      requestId: before.requestId,
    });
  }

  revalidatePath("/admin/disputes");
  revalidatePath("/admin");
}
