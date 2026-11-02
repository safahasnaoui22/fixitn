import { prisma } from "./client";

export type SeniorChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  body: string;
  createdAt: string;
};

/** True if this user is an ACTIVE technician with the Senior Pro badge. */
export async function isActiveSenior(userId: string): Promise<boolean> {
  const t = await prisma.technician.findUnique({
    where: { userId },
    select: { isSenior: true, accountStatus: true },
  });
  return !!t && t.isSenior && t.accountStatus === "ACTIVE";
}

export async function listSeniorMessages(limit = 150): Promise<SeniorChatMessage[]> {
  const rows = await prisma.seniorMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: { fullName: true, avatarUrl: true } } },
  });
  return rows.reverse().map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.fullName,
    senderAvatar: m.sender.avatarUrl,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function countSeniorMembers(): Promise<number> {
  return prisma.technician.count({ where: { isSenior: true, accountStatus: "ACTIVE" } });
}

export async function seniorUnreadCount(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { seniorChatReadAt: true },
  });
  return prisma.seniorMessage.count({
    where: {
      senderId: { not: userId },
      ...(u?.seniorChatReadAt ? { createdAt: { gt: u.seniorChatReadAt } } : {}),
    },
  });
}

export async function markSeniorChatRead(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { seniorChatReadAt: new Date() } });
}

/** Save a message and push-notify the other seniors (never throws on push errors). */
export async function postSeniorMessage(senderId: string, senderName: string, body: string) {
  await prisma.seniorMessage.create({ data: { senderId, body } });

  const others = await prisma.technician.findMany({
    where: { isSenior: true, accountStatus: "ACTIVE", userId: { not: senderId } },
    select: { userId: true },
  });
  if (others.length === 0) return;

  try {
    const { sendPushToUser } = await import("../webpush");
    await Promise.allSettled(
      others.map((o) =>
        sendPushToUser(o.userId, {
          title: "👥 Cercle Senior",
          body: `${senderName}: ${body.slice(0, 90)}`,
          url: "/t/senior/group",
          tag: "senior-chat",
        })
      )
    );
  } catch {
    /* push failure must never break the chat */
  }
}


export type SeniorContact = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  title: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

/** The other active Senior technicians, with the last private message and unread count. */
export async function listSeniorContacts(userId: string): Promise<SeniorContact[]> {
  const seniors = await prisma.technician.findMany({
    where: { isSenior: true, accountStatus: "ACTIVE", userId: { not: userId } },
    select: { title: true, user: { select: { id: true, fullName: true, avatarUrl: true } } },
  });
  if (seniors.length === 0) return [];

  const ids = seniors.map((t) => t.user.id);
  const msgs = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: ids } },
        { toUserId: userId, fromUserId: { in: ids } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { fromUserId: true, toUserId: true, body: true, read: true, createdAt: true },
  });

  const contacts = seniors.map((t) => {
    const mine = msgs.filter((m) => m.fromUserId === t.user.id || m.toUserId === t.user.id);
    const last = mine[0];
    return {
      userId: t.user.id,
      fullName: t.user.fullName,
      avatarUrl: t.user.avatarUrl,
      title: t.title,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      unreadCount: mine.filter((m) => m.toUserId === userId && !m.read).length,
    };
  });

  return contacts.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.fullName.localeCompare(b.fullName);
  });
}

/** Unread private messages coming from other Senior technicians. */
export async function seniorDirectUnreadCount(userId: string): Promise<number> {
  return prisma.supportMessage.count({
    where: { toUserId: userId, read: false, fromUser: { technician: { isSenior: true } } },
  });
}

/** True if both users are active Senior technicians (private senior chat is allowed). */
export async function areBothActiveSeniors(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([isActiveSenior(a), isActiveSenior(b)]);
  return x && y;
}
