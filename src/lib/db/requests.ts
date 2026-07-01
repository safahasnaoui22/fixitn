import { prisma } from "./client";
import { createNotification } from "./notifications";
import { parseStringArray, toStringArray } from "../utils";
import type { JobStatus } from "../constants";
import type { MessageWithSender, ServiceRequestWithRelations } from "../types";

const REQUEST_INCLUDE = {
  category: true,
  technician: {
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  },
  client: { select: { id: true, fullName: true, avatarUrl: true } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRequest(r: any): ServiceRequestWithRelations {
  return {
    id: r.id,
    clientId: r.clientId,
    technicianId: r.technicianId,
    categoryId: r.categoryId,
    fullName: r.fullName,
    phone: r.phone,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    description: r.description,
    photos: parseStringArray(r.photos),
    status: r.status as JobStatus,
    clientConfirmedSolved: r.clientConfirmedSolved,
    pendingAt: r.pendingAt instanceof Date ? r.pendingAt.toISOString() : r.pendingAt,
    acceptedAt: r.acceptedAt ? (r.acceptedAt instanceof Date ? r.acceptedAt.toISOString() : r.acceptedAt) : null,
    onTheWayAt: r.onTheWayAt ? (r.onTheWayAt instanceof Date ? r.onTheWayAt.toISOString() : r.onTheWayAt) : null,
    arrivedAt: r.arrivedAt ? (r.arrivedAt instanceof Date ? r.arrivedAt.toISOString() : r.arrivedAt) : null,
    inProgressAt: r.inProgressAt ? (r.inProgressAt instanceof Date ? r.inProgressAt.toISOString() : r.inProgressAt) : null,
    completedAt: r.completedAt ? (r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt) : null,
    declinedAt: r.declinedAt ? (r.declinedAt instanceof Date ? r.declinedAt.toISOString() : r.declinedAt) : null,
    cancelledAt: r.cancelledAt ? (r.cancelledAt instanceof Date ? r.cancelledAt.toISOString() : r.cancelledAt) : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    categoryName: r.category.name,
    categoryIcon: r.category.icon,
    categoryColor: r.category.color,
    technicianUserId: r.technician.userId,
    technicianTitle: r.technician.title,
    technicianFullName: r.technician.user.fullName,
    technicianAvatarUrl: r.technician.user.avatarUrl,
    clientFullName: r.client.fullName,
    clientAvatarUrl: r.client.avatarUrl,
  };
}

export async function getRequestById(id: string): Promise<ServiceRequestWithRelations | null> {
  const r = await prisma.serviceRequest.findUnique({ where: { id }, include: REQUEST_INCLUDE });
  return r ? mapRequest(r) : null;
}

export async function listRequestsForClient(clientId: string): Promise<ServiceRequestWithRelations[]> {
  const rows = await prisma.serviceRequest.findMany({
    where: { clientId },
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRequest);
}

export async function listRequestsForTechnician(
  technicianId: string,
  status?: JobStatus[]
): Promise<ServiceRequestWithRelations[]> {
  const rows = await prisma.serviceRequest.findMany({
    where: {
      technicianId,
      ...(status && status.length > 0 ? { status: { in: status } } : {}),
    },
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRequest);
}

export async function getRequestParties(
  requestId: string
): Promise<{ clientUserId: string; technicianUserId: string } | null> {
  const r = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { clientId: true, technician: { select: { userId: true } } },
  });
  return r ? { clientUserId: r.clientId, technicianUserId: r.technician.userId } : null;
}

export async function createServiceRequest(input: {
  clientId: string;
  technicianId: string;
  categoryId: string;
  fullName: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  photos: string[];
}): Promise<string> {
  const req = await prisma.serviceRequest.create({
    data: {
      clientId: input.clientId,
      technicianId: input.technicianId,
      categoryId: input.categoryId,
      fullName: input.fullName,
      phone: input.phone,
      address: input.address,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      description: input.description,
      photos: toStringArray(input.photos),
      status: "PENDING",
    },
    select: { id: true, technician: { select: { userId: true } } },
  });

  await createNotification({
    userId: req.technician.userId,
    type: "NEW_REQUEST",
    title: "New service request",
    body: input.description.slice(0, 80),
    requestId: req.id,
  });

  return req.id;
}

export async function acceptRequest(requestId: string): Promise<void> {
  await prisma.serviceRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  const parties = await getRequestParties(requestId);
  if (parties) {
    await createNotification({
      userId: parties.clientUserId,
      type: "STATUS_UPDATE",
      title: "Your request was accepted",
      requestId,
    });
  }
}

export async function declineRequest(requestId: string): Promise<void> {
  await prisma.serviceRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "DECLINED", declinedAt: new Date() },
  });
  const parties = await getRequestParties(requestId);
  if (parties) {
    await createNotification({
      userId: parties.clientUserId,
      type: "STATUS_UPDATE",
      title: "Technician declined your request",
      body: "Try another technician from the list.",
      requestId,
    });
  }
}

export async function cancelRequest(requestId: string): Promise<void> {
  await prisma.serviceRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

const STATUS_TIMESTAMP: Record<string, string> = {
  ON_THE_WAY: "onTheWayAt",
  ARRIVED: "arrivedAt",
  IN_PROGRESS: "inProgressAt",
};

export async function advanceStatus(
  requestId: string,
  toStatus: "ON_THE_WAY" | "ARRIVED" | "IN_PROGRESS"
): Promise<void> {
  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status: toStatus, [STATUS_TIMESTAMP[toStatus]]: new Date() },
  });
  const parties = await getRequestParties(requestId);
  if (parties) {
    await createNotification({
      userId: parties.clientUserId,
      type: "STATUS_UPDATE",
      title: `Job status: ${toStatus.replaceAll("_", " ").toLowerCase()}`,
      requestId,
    });
  }
}

export async function markCompleted(requestId: string): Promise<void> {
  const req = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { technicianId: true },
  });
  if (!req) return;

  const tech = await prisma.technician.findUnique({
    where: { id: req.technicianId },
    select: { startingPrice: true, plan: { select: { commissionRate: true } } },
  });

  const commissionRate = tech?.plan?.commissionRate ?? 0.15;
  const amount = (tech?.startingPrice ?? 0) > 0 ? tech!.startingPrice : 40;
  const platformFee = Math.round(amount * commissionRate);

  await prisma.$transaction([
    prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.payment.create({
      data: {
        technicianId: req.technicianId,
        requestId,
        amount,
        platformFee,
        method: "D17",
        status: "PAID",
        type: "PAYOUT",
      },
    }),
  ]);

  const parties = await getRequestParties(requestId);
  if (parties) {
    await createNotification({
      userId: parties.clientUserId,
      type: "STATUS_UPDATE",
      title: "Job marked as completed",
      body: "Let us know if the problem was solved.",
      requestId,
    });
  }
}

export async function confirmSolved(requestId: string, solved: boolean): Promise<void> {
  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { clientConfirmedSolved: solved },
  });
}

export async function getTechnicianDashboardStats(
  technicianId: string
): Promise<{ newToday: number; inProgress: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [newToday, inProgress] = await Promise.all([
    prisma.serviceRequest.count({
      where: { technicianId, status: "PENDING", createdAt: { gte: today } },
    }),
    prisma.serviceRequest.count({
      where: { technicianId, status: { in: ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"] } },
    }),
  ]);

  return { newToday, inProgress };
}

// --- Messages -----------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(m: any): MessageWithSender {
  return {
    id: m.id,
    requestId: m.requestId,
    senderId: m.senderId,
    body: m.body,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    senderFullName: m.sender.fullName,
    senderAvatarUrl: m.sender.avatarUrl,
  };
}

export async function listMessages(requestId: string): Promise<MessageWithSender[]> {
  const messages = await prisma.message.findMany({
    where: { requestId },
    include: { sender: { select: { fullName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(mapMessage);
}

export async function createMessage(input: {
  requestId: string;
  senderId: string;
  body?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  await prisma.message.create({
    data: {
      requestId: input.requestId,
      senderId: input.senderId,
      body: input.body ?? null,
      imageUrl: input.imageUrl ?? null,
    },
  });

  const parties = await getRequestParties(input.requestId);
  if (parties) {
    const recipient =
      input.senderId === parties.clientUserId
        ? parties.technicianUserId
        : parties.clientUserId;
    await createNotification({
      userId: recipient,
      type: "NEW_MESSAGE",
      title: "New message",
      body: input.body ?? "Sent a photo",
      requestId: input.requestId,
    });
  }
}

// --- Chat inbox ---------------------------------------------------------

export interface ChatSummary {
  requestId: string;
  status: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  technicianFullName: string;
  technicianAvatarUrl: string | null;
  clientFullName: string;
  clientAvatarUrl: string | null;
  clientId: string;
  technicianUserId: string;
  lastMsg: string | null;
  lastMsgAt: string | null;
}

export async function listChatsForUser(userId: string): Promise<ChatSummary[]> {
  type RawRow = {
    requestId: string;
    status: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    technicianFullName: string;
    technicianAvatarUrl: string | null;
    clientFullName: string;
    clientAvatarUrl: string | null;
    clientId: string;
    technicianUserId: string;
    lastMsg: string | null;
    lastMsgAt: Date | string | null;
  };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      sr.id                                                                  AS "requestId",
      sr.status,
      c.name                                                                 AS "categoryName",
      c.icon                                                                 AS "categoryIcon",
      c.color                                                                AS "categoryColor",
      tu."fullName"                                                          AS "technicianFullName",
      tu."avatarUrl"                                                         AS "technicianAvatarUrl",
      cu."fullName"                                                          AS "clientFullName",
      cu."avatarUrl"                                                         AS "clientAvatarUrl",
      sr."clientId",
      tu.id                                                                  AS "technicianUserId",
      (SELECT m.body       FROM "Message" m WHERE m."requestId" = sr.id ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMsg",
      (SELECT m."createdAt" FROM "Message" m WHERE m."requestId" = sr.id ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMsgAt"
    FROM "ServiceRequest" sr
    JOIN "Category"    c  ON c.id   = sr."categoryId"
    JOIN "Technician"  t  ON t.id   = sr."technicianId"
    JOIN "User"        tu ON tu.id  = t."userId"
    JOIN "User"        cu ON cu.id  = sr."clientId"
    WHERE (sr."clientId" = ${userId} OR tu.id = ${userId})
      AND EXISTS (SELECT 1 FROM "Message" m WHERE m."requestId" = sr.id)
    ORDER BY "lastMsgAt" DESC NULLS LAST
  `;

  return rows.map((r) => ({
    ...r,
    lastMsgAt: r.lastMsgAt
      ? r.lastMsgAt instanceof Date
        ? r.lastMsgAt.toISOString()
        : String(r.lastMsgAt)
      : null,
  }));
}