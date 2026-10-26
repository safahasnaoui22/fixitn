import { prisma } from "./client";

export interface AttentionItem {
  key: string;
  label: string;
  count: number;
  href: string;
  tone: "red" | "amber" | "blue";
}

/** Everything the admin should look at today (one query batch). */
export async function getAttentionItems(stuckHours = 24): Promise<AttentionItem[]> {
  const now = Date.now();
  const stuckBefore = new Date(now - stuckHours * 3600 * 1000);
  const activeStuckBefore = new Date(now - 48 * 3600 * 1000);
  const in7days = new Date(now + 7 * 24 * 3600 * 1000);
  const since24h = new Date(now - 24 * 3600 * 1000);

  const [
    pendingTechs,
    supportRows,
    stuckPending,
    stuckActive,
    badPayments,
    openReports,
    sharedFaces,
    expiring,
  ] = await Promise.all([
    prisma.technician.count({ where: { accountStatus: "PENDING" } }),
    prisma.supportMessage.findMany({
      where: { read: false, toUser: { role: { in: ["ADMIN", "SOUS_ADMIN"] } } },
      distinct: ["fromUserId"],
      select: { fromUserId: true },
    }),
    prisma.serviceRequest.count({
      where: { status: "PENDING", pendingAt: { lt: stuckBefore } },
    }),
    prisma.serviceRequest.count({
      where: {
        status: { in: ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"] },
        updatedAt: { lt: activeStuckBefore },
      },
    }),
    prisma.payment.count({ where: { status: { not: "PAID" } } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.securityEvent.count({
      where: { type: "FACE_SHARED", createdAt: { gte: since24h } },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE", expiresAt: { gte: new Date(now), lte: in7days } },
    }),
  ]);

  const items: AttentionItem[] = [
    { key: "techs", label: "Technicians waiting for approval", count: pendingTechs, href: "/admin/technicians", tone: "amber" },
    { key: "support", label: "Support chats waiting for an answer", count: supportRows.length, href: "/admin/support", tone: "red" },
    { key: "stuck", label: `Requests pending for more than ${stuckHours} h`, count: stuckPending, href: "/admin/requests", tone: "red" },
    { key: "active", label: "Jobs in progress with no update for 48 h", count: stuckActive, href: "/admin/requests", tone: "amber" },
    { key: "pay", label: "Payments pending or failed", count: badPayments, href: "/admin/payments", tone: "red" },
    { key: "reports", label: "Open disputes / reports", count: openReports, href: "/admin/complaints", tone: "red" },
    { key: "faces", label: "Shared-face alerts (last 24 h)", count: sharedFaces, href: "/admin/security?type=FACE_SHARED", tone: "red" },
    { key: "subs", label: "Plans expiring in the next 7 days", count: expiring, href: "/admin/subscriptions", tone: "blue" },
  ];
  return items;
}
