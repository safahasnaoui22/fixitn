import { db, dbReady, genId } from "./client";
import type { Notification } from "../types";
import type { NotificationType } from "../constants";

function now(): string {
  return new Date().toISOString();
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.userId as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    requestId: (row.requestId as string | null) ?? null,
    read: Boolean(row.read),
    createdAt: row.createdAt as string,
  };
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  requestId?: string | null;
}): Promise<void> {
  await dbReady;
  await db.execute({
    sql: `INSERT INTO Notification (id, userId, type, title, body, requestId, read, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [
      genId(),
      input.userId,
      input.type,
      input.title,
      input.body ?? null,
      input.requestId ?? null,
      now(),
    ],
  });
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
    args: [userId],
  });
  return res.rows.map((r) => mapNotification(r as unknown as Record<string, unknown>));
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT COUNT(*) as n FROM Notification WHERE userId = ? AND read = 0",
    args: [userId],
  });
  return Number(res.rows[0]?.n ?? 0);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await dbReady;
  await db.execute({
    sql: "UPDATE Notification SET read = 1 WHERE userId = ? AND read = 0",
    args: [userId],
  });
}