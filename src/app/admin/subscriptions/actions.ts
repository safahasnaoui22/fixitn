"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

async function notifyOne(subId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subId },
    select: {
      expiresAt: true,
      plan: { select: { name: true } },
      technician: { select: { userId: true } },
    },
  });
  if (!sub) return false;
  const expired = sub.expiresAt && sub.expiresAt.getTime() < Date.now();
  await createNotification({
    userId: sub.technician.userId,
    type: "STATUS_UPDATE",
    title: expired ? `Your ${sub.plan.name} plan has expired` : `Your ${sub.plan.name} plan expires soon`,
    body: "Renew your plan to keep your visibility and your commission rate.",
  });
  return true;
}

export async function notifySubscriptionAction(subId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  if (await notifyOne(subId)) {
    await logAudit(actor, {
      action: "subscription.notify",
      entityType: "plan",
      entityId: subId,
      summary: "Sent a plan renewal reminder",
    });
  }
  revalidatePath("/admin/subscriptions");
}

export async function notifyAllExpiringAction(): Promise<void> {
  const actor = await requireRole("ADMIN");
  const in7 = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: in7 } },
    select: { id: true },
    take: 500,
  });
  for (const s of subs) await notifyOne(s.id);
  await logAudit(actor, {
    action: "subscription.notifyAll",
    entityType: "plan",
    entityId: "all",
    summary: `Sent plan renewal reminders to ${subs.length} technician(s)`,
  });
  revalidatePath("/admin/subscriptions");
}
