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

const SUPPORT_ROLES = ["ADMIN", "SOUS_ADMIN"];

async function getSupportUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: SUPPORT_ROLES } },
    select: { id: true },
  });
  return users.map((user) => user.id);
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
  await prisma.supportMessage.create({ data: { fromUserId, toUserId, body } });
}

/**
 * Support chats are shared between ADMIN and SOUS_ADMIN. When one of the
 * participants is a support user, include messages exchanged with every
 * support account so either role can continue the same conversation.
 */
export async function listSupportMessages(
  userId1: string,
  userId2: string
): Promise<SupportMessage[]> {
  const [user1, user2, supportIds] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId1 }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId2 }, select: { role: true } }),
    getSupportUserIds(),
  ]);

  let where;
  if (user1 && SUPPORT_ROLES.includes(user1.role) && user2 && !SUPPORT_ROLES.includes(user2.role)) {
    where = {
      OR: [
        { fromUserId: userId2, toUserId: { in: supportIds } },
        { fromUserId: { in: supportIds }, toUserId: userId2 },
      ],
    };
  } else if (user2 && SUPPORT_ROLES.includes(user2.role) && user1 && !SUPPORT_ROLES.includes(user1.role)) {
    where = {
      OR: [
        { fromUserId: userId1, toUserId: { in: supportIds } },
        { fromUserId: { in: supportIds }, toUserId: userId1 },
      ],
    };
  } else {
    where = {
      OR: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
    };
  }

  const messages = await prisma.supportMessage.findMany({
    where,
    include: {
      fromUser: { select: { fullName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(mapMessage);
}

/** Mark a client's messages as read across the shared support inbox. */
export async function markMessagesRead(
  toUserId: string,
  fromUserId: string
): Promise<void> {
  const recipient = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { role: true },
  });

  if (recipient && SUPPORT_ROLES.includes(recipient.role)) {
    const supportIds = await getSupportUserIds();
    await prisma.supportMessage.updateMany({
      where: {
        fromUserId,
        toUserId: { in: supportIds },
        read: false,
      },
      data: { read: true },
    });
    return;
  }

  await prisma.supportMessage.updateMany({
    where: { fromUserId, toUserId, read: false },
    data: { read: true },
  });
}

export async function getUnreadSupportCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && SUPPORT_ROLES.includes(user.role)) {
    const supportIds = await getSupportUserIds();
    return prisma.supportMessage.count({
      where: { toUserId: { in: supportIds }, read: false },
    });
  }

  return prisma.supportMessage.count({ where: { toUserId: userId, read: false } });
}

/** Shared conversation list for Admin and Sous-admin. */
export async function listSupportConversations(
  supportUserId: string
): Promise<SupportConversation[]> {
  const supportIds = await getSupportUserIds();
  if (!supportIds.includes(supportUserId)) return [];

  const messages = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { toUserId: { in: supportIds } },
        { fromUserId: { in: supportIds } },
      ],
    },
    include: {
      fromUser: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      toUser: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const result: SupportConversation[] = [];

  for (const message of messages) {
    const other = SUPPORT_ROLES.includes(message.fromUser.role)
      ? message.toUser
      : message.fromUser;

    if (SUPPORT_ROLES.includes(other.role) || seen.has(other.id)) continue;
    seen.add(other.id);

    const unreadCount = await prisma.supportMessage.count({
      where: {
        fromUserId: other.id,
        toUserId: { in: supportIds },
        read: false,
      },
    });

    result.push({
      userId: other.id,
      fullName: other.fullName,
      avatarUrl: other.avatarUrl,
      role: other.role,
      lastMessage: message.body,
      lastMessageAt: message.createdAt.toISOString(),
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

// For clients/technicians: find the sous-admin to contact.
export async function findSousAdminToContact(): Promise<{
  id: string;
  fullName: string;
  avatarUrl: string | null;
} | null> {
  const sousAdmin = await prisma.user.findFirst({
    where: { role: "SOUS_ADMIN" },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  return sousAdmin ?? null;
}
