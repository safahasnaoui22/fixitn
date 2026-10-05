import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

// GET — load all messages between this user and support
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find any admin or sous-admin
  const support = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SOUS_ADMIN"] } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!support) {
    return NextResponse.json({ messages: [], myUserId: session.userId });
  }

  const messages = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { fromUserId: session.userId, toUserId: support.id },
        { fromUserId: support.id,     toUserId: session.userId },
      ],
    },
    include: {
      fromUser: { select: { fullName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark messages from support as read
  await prisma.supportMessage.updateMany({
    where: { fromUserId: support.id, toUserId: session.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({
    myUserId: session.userId,
    messages: messages.map((m) => ({
      id: m.id,
      fromUserId: m.fromUserId,
      toUserId: m.toUserId,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
      fromUserName: m.fromUser.fullName,
      fromUserAvatar: m.fromUser.avatarUrl,
      fromUserRole: m.fromUser.role,
    })),
  });
}

// POST — send a message to support
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  // Find sous-admin first, fall back to admin
  const support = await prisma.user.findFirst({
    where: { role: { in: ["SOUS_ADMIN", "ADMIN"] } },
    select: { id: true, role: true },
    orderBy: [
      // prefer sous-admin (they handle support)
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });

  if (!support) {
    return NextResponse.json(
      { error: "Service support indisponible pour le moment." },
      { status: 503 }
    );
  }

  // Save message
  await prisma.supportMessage.create({
    data: {
      fromUserId: session.userId,
      toUserId: support.id,
      body: body.trim(),
    },
  });

  // Notify the support agent
  await createNotification({
    userId: support.id,
    type: "NEW_MESSAGE",
    title: `💬 Message de ${session.fullName}`,
    body: body.trim().slice(0, 80),
    requestId: null,
  });

  return NextResponse.json({ ok: true });
}