import { db, dbReady, genId } from "./client";
import { createNotification } from "./notifications";
import { parseStringArray, toStringArray } from "../utils";
import type { JobStatus } from "../constants";
import type { MessageWithSender, ServiceRequestWithRelations } from "../types";

function now(): string {
  return new Date().toISOString();
}

const REQUEST_WITH_RELATIONS_SELECT = `
  SELECT sr.*,
    c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
    tu.id as technicianUserId, t.title as technicianTitle,
    tu.fullName as technicianFullName, tu.avatarUrl as technicianAvatarUrl,
    cu.fullName as clientFullName, cu.avatarUrl as clientAvatarUrl
  FROM ServiceRequest sr
  JOIN Category c ON c.id = sr.categoryId
  JOIN Technician t ON t.id = sr.technicianId
  JOIN User tu ON tu.id = t.userId
  JOIN User cu ON cu.id = sr.clientId
`;

function mapRequest(row: Record<string, unknown>): ServiceRequestWithRelations {
  return {
    id: row.id as string,
    clientId: row.clientId as string,
    technicianId: row.technicianId as string,
    categoryId: row.categoryId as string,
    fullName: row.fullName as string,
    phone: row.phone as string,
    address: row.address as string,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    description: row.description as string,
    photos: parseStringArray(row.photos as string | null),
    status: row.status as JobStatus,
    clientConfirmedSolved:
      row.clientConfirmedSolved == null ? null : Boolean(row.clientConfirmedSolved),
    pendingAt: row.pendingAt as string,
    acceptedAt: (row.acceptedAt as string | null) ?? null,
    onTheWayAt: (row.onTheWayAt as string | null) ?? null,
    arrivedAt: (row.arrivedAt as string | null) ?? null,
    inProgressAt: (row.inProgressAt as string | null) ?? null,
    completedAt: (row.completedAt as string | null) ?? null,
    declinedAt: (row.declinedAt as string | null) ?? null,
    cancelledAt: (row.cancelledAt as string | null) ?? null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    categoryName: row.categoryName as string,
    categoryIcon: row.categoryIcon as string,
    categoryColor: row.categoryColor as string,
    technicianUserId: row.technicianUserId as string,
    technicianTitle: row.technicianTitle as string,
    technicianFullName: row.technicianFullName as string,
    technicianAvatarUrl: (row.technicianAvatarUrl as string | null) ?? null,
    clientFullName: row.clientFullName as string,
    clientAvatarUrl: (row.clientAvatarUrl as string | null) ?? null,
  };
}

function mapMessage(row: Record<string, unknown>): MessageWithSender {
  return {
    id: row.id as string,
    requestId: row.requestId as string,
    senderId: row.senderId as string,
    body: (row.body as string | null) ?? null,
    imageUrl: (row.imageUrl as string | null) ?? null,
    createdAt: row.createdAt as string,
    senderFullName: row.senderFullName as string,
    senderAvatarUrl: (row.senderAvatarUrl as string | null) ?? null,
  };
}

export async function listChatsForUser(userId: string): Promise<
  Array<{
    requestId: string;
    clientId: string;
    technicianId: string;
    status: JobStatus;

    clientFullName: string;
    clientAvatarUrl: string | null;

    technicianFullName: string;
    technicianAvatarUrl: string | null;

    categoryName: string;
    categoryIcon: string;
    categoryColor: string;

    lastMsg: string | null;
    lastMsgAt: string | null;
  }>
> {
  await dbReady;

  const res = await db.execute({
    sql: `
      SELECT
        sr.id                AS requestId,
        sr.clientId,
        sr.technicianId,
        sr.status,

        cu.fullName          AS clientFullName,
        cu.avatarUrl         AS clientAvatarUrl,

        tu.fullName          AS technicianFullName,
        tu.avatarUrl         AS technicianAvatarUrl,

        c.name               AS categoryName,
        c.icon               AS categoryIcon,
        c.color              AS categoryColor,

        (
          SELECT m.body
          FROM Message m
          WHERE m.requestId = sr.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMsg,

        (
          SELECT m.createdAt
          FROM Message m
          WHERE m.requestId = sr.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMsgAt

      FROM ServiceRequest sr

      JOIN Category c
        ON c.id = sr.categoryId

      JOIN Technician t
        ON t.id = sr.technicianId

      JOIN User tu
        ON tu.id = t.userId

      JOIN User cu
        ON cu.id = sr.clientId

      WHERE
          sr.clientId = ?
          OR tu.id = ?

      ORDER BY COALESCE(lastMsgAt, sr.updatedAt) DESC
    `,
    args: [userId, userId],
  });

  return res.rows.map((row) => ({
    requestId: row.requestId as string,
    clientId: row.clientId as string,
    technicianId: row.technicianId as string,
    status: row.status as JobStatus,

    clientFullName: row.clientFullName as string,
    clientAvatarUrl: (row.clientAvatarUrl as string | null) ?? null,

    technicianFullName: row.technicianFullName as string,
    technicianAvatarUrl:
      (row.technicianAvatarUrl as string | null) ?? null,

    categoryName: row.categoryName as string,
    categoryIcon: row.categoryIcon as string,
    categoryColor: row.categoryColor as string,

    lastMsg: (row.lastMsg as string | null) ?? null,
    lastMsgAt: (row.lastMsgAt as string | null) ?? null,
  }));
}

export async function getRequestById(id: string): Promise<ServiceRequestWithRelations | null> {
  await dbReady;
  const res = await db.execute({
    sql: `${REQUEST_WITH_RELATIONS_SELECT} WHERE sr.id = ?`,
    args: [id],
  });
  const row = res.rows[0];
  return row ? mapRequest(row as unknown as Record<string, unknown>) : null;
}

export async function listRequestsForClient(
  clientId: string
): Promise<ServiceRequestWithRelations[]> {
  await dbReady;
  const res = await db.execute({
    sql: `${REQUEST_WITH_RELATIONS_SELECT} WHERE sr.clientId = ? ORDER BY sr.createdAt DESC`,
    args: [clientId],
  });
  return res.rows.map((r) => mapRequest(r as unknown as Record<string, unknown>));
}

export async function listRequestsForTechnician(
  technicianId: string,
  status?: JobStatus[]
): Promise<ServiceRequestWithRelations[]> {
  await dbReady;
  if (!status || status.length === 0) {
    const res = await db.execute({
      sql: `${REQUEST_WITH_RELATIONS_SELECT} WHERE sr.technicianId = ? ORDER BY sr.createdAt DESC`,
      args: [technicianId],
    });
    return res.rows.map((r) => mapRequest(r as unknown as Record<string, unknown>));
  }
  const placeholders = status.map(() => "?").join(", ");
  const res = await db.execute({
    sql: `${REQUEST_WITH_RELATIONS_SELECT} WHERE sr.technicianId = ? AND sr.status IN (${placeholders}) ORDER BY sr.createdAt DESC`,
    args: [technicianId, ...status],
  });
  return res.rows.map((r) => mapRequest(r as unknown as Record<string, unknown>));
}

export async function getRequestParties(
  requestId: string
): Promise<{ clientUserId: string; technicianUserId: string } | null> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT sr.clientId as clientUserId, tu.id as technicianUserId
          FROM ServiceRequest sr
          JOIN Technician t ON t.id = sr.technicianId
          JOIN User tu ON tu.id = t.userId
          WHERE sr.id = ?`,
    args: [requestId],
  });
  const row = res.rows[0];
  return row
    ? { clientUserId: row.clientUserId as string, technicianUserId: row.technicianUserId as string }
    : null;
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
  await dbReady;
  const id = genId();
  const ts = now();
  await db.execute({
    sql: `INSERT INTO ServiceRequest
      (id, clientId, technicianId, categoryId, fullName, phone, address, latitude, longitude,
       description, photos, status, pendingAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
    args: [
      id,
      input.clientId,
      input.technicianId,
      input.categoryId,
      input.fullName,
      input.phone,
      input.address,
      input.latitude ?? null,
      input.longitude ?? null,
      input.description,
      toStringArray(input.photos),
      ts,
      ts,
      ts,
    ],
  });

  const techRes = await db.execute({
    sql: "SELECT userId FROM Technician WHERE id = ?",
    args: [input.technicianId],
  });
  const technicianUserId = techRes.rows[0]?.userId as string | undefined;
  if (technicianUserId) {
    await createNotification({
      userId: technicianUserId,
      type: "NEW_REQUEST",
      title: "New service request",
      body: input.description.slice(0, 80),
      requestId: id,
    });
  }
  return id;
}

export async function acceptRequest(requestId: string): Promise<void> {
  await dbReady;
  const ts = now();
  await db.execute({
    sql: "UPDATE ServiceRequest SET status = 'ACCEPTED', acceptedAt = ?, updatedAt = ? WHERE id = ? AND status = 'PENDING'",
    args: [ts, ts, requestId],
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
  await dbReady;
  const ts = now();
  await db.execute({
    sql: "UPDATE ServiceRequest SET status = 'DECLINED', declinedAt = ?, updatedAt = ? WHERE id = ? AND status = 'PENDING'",
    args: [ts, ts, requestId],
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
  await dbReady;
  const ts = now();
  await db.execute({
    sql: "UPDATE ServiceRequest SET status = 'CANCELLED', cancelledAt = ?, updatedAt = ? WHERE id = ? AND status = 'PENDING'",
    args: [ts, ts, requestId],
  });
}

const STATUS_TIMESTAMP_COLUMN: Partial<Record<JobStatus, string>> = {
  ON_THE_WAY: "onTheWayAt",
  ARRIVED: "arrivedAt",
  IN_PROGRESS: "inProgressAt",
};

/** For the non-terminal middle statuses only — completion goes through markCompleted. */
export async function advanceStatus(
  requestId: string,
  toStatus: "ON_THE_WAY" | "ARRIVED" | "IN_PROGRESS"
): Promise<void> {
  await dbReady;
  const ts = now();
  const column = STATUS_TIMESTAMP_COLUMN[toStatus];
  await db.execute({
    sql: `UPDATE ServiceRequest SET status = ?, ${column} = ?, updatedAt = ? WHERE id = ?`,
    args: [toStatus, ts, ts, requestId],
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
  await dbReady;
  const reqRes = await db.execute({
    sql: "SELECT technicianId FROM ServiceRequest WHERE id = ?",
    args: [requestId],
  });
  const technicianId = reqRes.rows[0]?.technicianId as string | undefined;
  if (!technicianId) return;

  const techRes = await db.execute({
    sql: `SELECT t.startingPrice as startingPrice, COALESCE(p.commissionRate, 0.15) as commissionRate
          FROM Technician t LEFT JOIN Plan p ON p.id = t.planId WHERE t.id = ?`,
    args: [technicianId],
  });
  const startingPrice = Number(techRes.rows[0]?.startingPrice ?? 0);
  const commissionRate = Number(techRes.rows[0]?.commissionRate ?? 0.15);
  const amount = startingPrice > 0 ? startingPrice : 40;
  const platformFee = Math.round(amount * commissionRate);

  const ts = now();
  await db.execute({
    sql: "UPDATE ServiceRequest SET status = 'COMPLETED', completedAt = ?, updatedAt = ? WHERE id = ?",
    args: [ts, ts, requestId],
  });
  await db.execute({
    sql: `INSERT INTO Payment (id, technicianId, requestId, amount, platformFee, method, status, type, createdAt)
          VALUES (?, ?, ?, ?, ?, 'D17', 'PAID', 'PAYOUT', ?)`,
    args: [genId(), technicianId, requestId, amount, platformFee, ts],
  });

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
  await dbReady;
  await db.execute({
    sql: "UPDATE ServiceRequest SET clientConfirmedSolved = ? WHERE id = ?",
    args: [solved ? 1 : 0, requestId],
  });
}

export async function getTechnicianDashboardStats(
  technicianId: string
): Promise<{ newToday: number; inProgress: number }> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN date(createdAt) = date('now') AND status = 'PENDING' THEN 1 ELSE 0 END) as newToday,
            SUM(CASE WHEN status IN ('ACCEPTED','ON_THE_WAY','ARRIVED','IN_PROGRESS') THEN 1 ELSE 0 END) as inProgress
          FROM ServiceRequest WHERE technicianId = ?`,
    args: [technicianId],
  });
  return {
    newToday: Number(res.rows[0]?.newToday ?? 0),
    inProgress: Number(res.rows[0]?.inProgress ?? 0),
  };
}

// --- Messages -------------------------------------------------------------

export async function listMessages(requestId: string): Promise<MessageWithSender[]> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT m.*, u.fullName as senderFullName, u.avatarUrl as senderAvatarUrl
          FROM Message m JOIN User u ON u.id = m.senderId
          WHERE m.requestId = ? ORDER BY m.createdAt ASC`,
    args: [requestId],
  });
  return res.rows.map((r) => mapMessage(r as unknown as Record<string, unknown>));
}

export async function createMessage(input: {
  requestId: string;
  senderId: string;
  body?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  await dbReady;
  const ts = now();
  await db.execute({
    sql: `INSERT INTO Message (id, requestId, senderId, body, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [genId(), input.requestId, input.senderId, input.body ?? null, input.imageUrl ?? null, ts],
  });
  const parties = await getRequestParties(input.requestId);
  if (parties) {
    const recipient =
      input.senderId === parties.clientUserId ? parties.technicianUserId : parties.clientUserId;
    await createNotification({
      userId: recipient,
      type: "NEW_MESSAGE",
      title: "New message",
      body: input.body ?? "Sent a photo",
      requestId: input.requestId,
    });
  }
}