import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

const SUPPORT_ROLES = ["ADMIN", "SOUS_ADMIN"];

// GET — load the shared support conversation for the signed-in user.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supportUsers = await prisma.user.findMany({
    where: { role: { in: SUPPORT_ROLES } },
    select: { id: true },
  });
  const supportIds = supportUsers.map((user) => user.id);

  if (supportIds.length === 0) {
    return NextResponse.json({ messages: [], myUserId: session.userId });
  }

  const messages = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { fromUserId: session.userId, toUserId: { in: supportIds } },
        { fromUserId: { in: supportIds }, toUserId: session.userId },
      ],
    },
    include: {
      fromUser: { select: { fullName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark support replies to this user as read.
  await prisma.supportMessage.updateMany({
    where: {
      fromUserId: { in: supportIds },
      toUserId: session.userId,
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({
    myUserId: session.userId,
    messages: messages.map((message) => ({
      id: message.id,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
      fromUserName: message.fromUser.fullName,
      fromUserAvatar: message.fromUser.avatarUrl,
      fromUserRole: message.fromUser.role,
    })),
  });
}

// POST — send a message to the shared support inbox.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: string;
  try {
    const payload = await req.json();
    body = typeof payload.body === "string" ? payload.body.trim() : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const supportUsers = await prisma.user.findMany({
    where: { role: { in: SUPPORT_ROLES } },
    select: { id: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  if (supportUsers.length === 0) {
    return NextResponse.json(
      { error: "Service support indisponible pour le moment." },
      { status: 503 }
    );
  }

  // Store one copy of the incoming message. Both support roles can see it
  // through the shared inbox; avoid creating duplicate message bubbles.
  const preferredSupport =
    supportUsers.find((user) => user.role === "SOUS_ADMIN") ?? supportUsers[0];

  await prisma.supportMessage.create({
    data: {
      fromUserId: session.userId,
      toUserId: preferredSupport.id,
      body,
    },
  });

  // Notify every Admin and Sous-admin so either can respond.
  await Promise.all(
    supportUsers.map((supportUser) =>
      createNotification({
        userId: supportUser.id,
        type: "NEW_MESSAGE",
        title: `💬 Message de ${session.fullName}`,
        body: body.slice(0, 80),
        requestId: null,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
