import { prisma } from "./client";
import type { Notification } from "../types";
import type { NotificationType } from "../constants";

function mapNotification(n: {
  id: string; userId: string; type: string; title: string;
  body: string | null; requestId: string | null; read: boolean; createdAt: Date;
}): Notification {
  return { ...n, type: n.type as NotificationType, createdAt: n.createdAt.toISOString() };
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  requestId?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      requestId: input.requestId ?? null,
    },
  });
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const notifs = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return notifs.map(mapNotification);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}