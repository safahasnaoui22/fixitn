import { prisma } from "./client";

export interface SupportMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  read: boolean;
  createdAt: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  fromUserRole: string;
}

export interface SupportConversation {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(m: any): SupportMessage {
  return {
    id: m.id,
    fromUserId: m.fromUserId,
    toUserId: m.toUserId,
    body: m.body,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
    fromUserName: m.fromUser.fullName,
    fromUserAvatar: m.fromUser.avatarUrl,
    fromUserRole: m.fromUser.role,
  };
}

export async function sendSupportMessage(
  fromUserId: string,
  toUserId: string,
  body: string
): Promise<void> {
  await prisma.supportMessage.create({
    data: { fromUserId, toUserId, body },
  });
}

export async function listSupportMessages(
  userId1: string,
  userId2: string
): Promise<SupportMessage[]> {
  const messages = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
    },
    include: {
      fromUser: { select: { fullName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(mapMessage);
}

export async function markMessagesRead(
  toUserId: string,
  fromUserId: string
): Promise<void> {
  await prisma.supportMessage.updateMany({
    where: { fromUserId, toUserId, read: false },
    data: { read: true },
  });
}

export async function getUnreadSupportCount(userId: string): Promise<number> {
  return prisma.supportMessage.count({
    where: { toUserId: userId, read: false },
  });
}

export async function listSupportConversations(
  sousAdminUserId: string
): Promise<SupportConversation[]> {
  // Get all messages involving this sous-admin
  const messages = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { toUserId: sousAdminUserId },
        { fromUserId: sousAdminUserId },
      ],
    },
    include: {
      fromUser: {
        select: { id: true, fullName: true, avatarUrl: true, role: true },
      },
      toUser: {
        select: { id: true, fullName: true, avatarUrl: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by the OTHER user (not the sous-admin)
  const seen = new Set<string>();
  const result: SupportConversation[] = [];

  for (const msg of messages) {
    const other =
      msg.fromUserId === sousAdminUserId ? msg.toUser : msg.fromUser;
    if (seen.has(other.id)) continue;
    seen.add(other.id);

    const unreadCount = await prisma.supportMessage.count({
      where: {
        fromUserId: other.id,
        toUserId: sousAdminUserId,
        read: false,
      },
    });

    result.push({
      userId: other.id,
      fullName: other.fullName,
      avatarUrl: other.avatarUrl,
      role: other.role,
      lastMessage: msg.body,
      lastMessageAt: msg.createdAt.toISOString(),
      unreadCount,
    });
  }

  return result;
}

export async function getSousAdminUserId(): Promise<string | null> {
  const sousAdmin = await prisma.user.findFirst({
    where: { role: "SOUS_ADMIN" },
    select: { id: true },
  });
  return sousAdmin?.id ?? null;
}

// For clients/techs: find the sous-admin to contact
export async function findSousAdminToContact(): Promise<{
  id: string;
  fullName: string;
  avatarUrl: string | null;
} | null> {
  const sa = await prisma.user.findFirst({
    where: { role: "SOUS_ADMIN" },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  return sa ?? null;
}