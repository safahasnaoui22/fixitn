import { prisma } from "./client";
import { createNotification } from "./notifications";

export async function approveTechnician(technicianId: string): Promise<void> {
  const tech = await prisma.technician.update({
    where: { id: technicianId },
    data: { accountStatus: "ACTIVE" },
    select: { userId: true },
  });
  await createNotification({
    userId: tech.userId,
    type: "STATUS_UPDATE",
    title: "✅ Account Approved!",
    body: "Your technician account has been approved. You can now receive job requests.",
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
    title: "Account Not Approved",
    body: "Your technician account was not approved. Please contact support.",
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