"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";
import { getT } from "@/lib/i18n/server";
import { i18nText, tDb } from "@/lib/i18n/translate";
import { REPORT_REASONS } from "@/lib/reportReasons";

export type ReportResult = { ok: boolean; error?: string };

/**
 * "Signaler" — a client reports a technician, or a technician reports a client.
 * The report (reason + the written message) goes to the complaints queue and every
 * ADMIN and every SOUS_ADMIN who has the "Complaints" function gets a notification.
 */
export async function createUserReportAction(formData: FormData): Promise<ReportResult> {
  const session = await requireUser();
  const t = await getT();

  const reportedUserId = String(formData.get("reportedUserId") ?? "").trim();
  const requestIdRaw = String(formData.get("requestId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim().slice(0, 1500);

  if (!reportedUserId) return { ok: false, error: t("booking.report.errNobody") };
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) {
    return { ok: false, error: t("booking.report.errReason") };
  }
  if (message.length < 5) {
    return { ok: false, error: t("booking.report.errMessage") };
  }
  if (reportedUserId === session.userId) return { ok: false, error: t("booking.report.errSelf") };

  const [reporter, reported] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { fullName: true, role: true } }),
    prisma.user.findUnique({ where: { id: reportedUserId }, select: { fullName: true, role: true } }),
  ]);
  if (!reporter || !reported) return { ok: false, error: t("booking.report.errNotFound") };

  // Only client <-> technician reports (staff are handled through support).
  const okPair =
    (reporter.role === "CLIENT" && reported.role === "TECHNICIAN") ||
    (reporter.role === "TECHNICIAN" && reported.role === "CLIENT");
  if (!okPair) return { ok: false, error: t("booking.report.errPair") };

  // A technician may only report a client he worked with; a client may report any technician.
  let requestId: string | null = null;
  if (requestIdRaw) {
    const req = await prisma.serviceRequest.findUnique({
      where: { id: requestIdRaw },
      select: { id: true, clientId: true, technician: { select: { userId: true } } },
    });
    const inJob =
      req &&
      ((req.clientId === session.userId && req.technician.userId === reportedUserId) ||
        (req.technician.userId === session.userId && req.clientId === reportedUserId));
    if (!inJob) return { ok: false, error: t("booking.report.errJob") };
    requestId = req.id;
  } else if (reporter.role === "TECHNICIAN") {
    const worked = await prisma.serviceRequest.findFirst({
      where: { clientId: reportedUserId, technician: { userId: session.userId } },
      select: { id: true },
    });
    if (!worked) return { ok: false, error: t("booking.report.errWorked") };
  }

  // no spam: one open report from you about the same person
  const open = await prisma.report.findFirst({
    where: {
      reporterId: session.userId,
      reportedUserId,
      status: { in: ["OPEN", "INVESTIGATING"] },
    },
    select: { id: true },
  });
  if (open) return { ok: false, error: t("booking.report.errDuplicate") };

  await prisma.report.create({
    data: {
      requestId,
      reporterId: session.userId,
      reporterName: reporter.fullName,
      reportedUserId,
      reportedName: reported.fullName,
      reason,
      details: message,
    },
  });

  // Open the conversation: the complaint text is the first message of the support chat,
  // so the person lands in a chat with the team (admin / sous-admin) right after reporting.
  const support = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SOUS_ADMIN"] } },
    select: { id: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  const preferred = support.find((u) => u.role === "SOUS_ADMIN") ?? support[0];
  if (preferred) {
    await prisma.supportMessage
      .create({
        data: {
          fromUserId: session.userId,
          toUserId: preferred.id,
          body: i18nText("booking.report.supportMsg", {
            name: reported.fullName,
            reason: tDb(t, "reportReason", reason),
            message,
          }),
        },
      })
      .catch(() => undefined);
  }

  const moderators = await prisma.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, { role: "SOUS_ADMIN", permissions: { has: "complaints" } }],
    },
    select: { id: true },
  });
  await Promise.allSettled(
    moderators.map((m) =>
      createNotification({
        userId: m.id,
        type: "STATUS_UPDATE",
        title: i18nText("booking.notif.report.title"),
        body: i18nText("booking.notif.report.body", {
          reporter: reporter.fullName,
          reported: reported.fullName,
          reason: tDb(t, "reportReason", reason),
          message: message.slice(0, 100),
        }),
        requestId,
      })
    )
  );

  revalidatePath("/admin/complaints");
  revalidatePath("/admin");
  return { ok: true };
}
