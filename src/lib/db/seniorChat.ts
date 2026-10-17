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
          url: "/t/senior",
          tag: "senior-chat",
        })
      )
    );
  } catch {
    /* push failure must never break the chat */
  }
}
