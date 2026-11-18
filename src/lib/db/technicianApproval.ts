import { prisma } from "./client";
import { createNotification } from "./notifications";
import { i18nText } from "@/lib/i18n/translate";

/**
 * Real approval state from the database (never trust a stale session value).
 * Returns true for non-technicians is the caller's job; this only checks technicians.
 */
export async function isTechnicianApproved(userId: string): Promise<boolean> {
  const tech = await prisma.technician.findUnique({
    where: { userId },
    select: { accountStatus: true },
  });
  return tech?.accountStatus === "ACTIVE";
}

export async function approveTechnician(technicianId: string): Promise<void> {
  const tech = await prisma.technician.update({
    where: { id: technicianId },
    data: { accountStatus: "ACTIVE" },
    select: { userId: true },
  });
  await createNotification({
    userId: tech.userId,
    type: "STATUS_UPDATE",
    title: i18nText("sys.notif.accountApproved.title"),
    body: i18nText("sys.notif.accountApproved.body"),
    requestId: null,
  });
}

export async function declineTechnician(technicianId: string): Promise<void> {
  const tech = await prisma.technician.update({
    where: { id: technicianId },
    data: { accountStatus: "DECLINED" },
    select: { userId: true },
  });
  await createNotification({
    userId: tech.userId,
    type: "STATUS_UPDATE",
    title: i18nText("sys.notif.accountDeclined.title"),
    body: i18nText("sys.notif.accountDeclined.body"),
    requestId: null,
  });
}

export async function archiveTechnician(technicianId: string): Promise<void> {
  await prisma.technician.update({
    where: { id: technicianId },
    data: { accountStatus: "ARCHIVED" },
  });
}

export async function updateTechnicianPlan(
  technicianId: string,
  planId: string
): Promise<void> {
  if (!planId) return;
  await prisma.technician.update({
    where: { id: technicianId },
    data: { planId },
  });
}