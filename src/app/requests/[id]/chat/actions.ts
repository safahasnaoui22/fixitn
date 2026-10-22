"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createMessage } from "@/lib/db/requests";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

export async function sendMessageAction(
  requestId: string,
  formData: FormData
): Promise<void> {
  const session = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await createMessage({ requestId, senderId: session.userId, body });
  revalidatePath(`/requests/${requestId}/chat`);
}

export async function reportChatParticipantAction(
  requestId: string,
  formData: FormData
): Promise<void> {
  const session = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  const allowedReasons = [
    "Harassment or bullying",
    "Scam or fraud",
    "Inappropriate messages",
    "Threats or unsafe behavior",
    "Other",
  ];
  if (!allowedReasons.includes(reason)) {
    throw new Error("Please choose a valid report reason.");
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      clientId: true,
      client: { select: { fullName: true } },
      technician: { select: { userId: true, user: { select: { fullName: true } } } },
    },
  });
  if (!request) throw new Error("Conversation not found.");

  const isClient = session.userId === request.clientId;
  const isTechnician = session.userId === request.technician.userId;
  if (!isClient && !isTechnician) {
    throw new Error("You are not allowed to report participants in this conversation.");
  }

  const reportedUserId = isClient ? request.technician.userId : request.clientId;
  const reporterName = isClient
    ? request.client.fullName
    : request.technician.user.fullName;
  const reportedName = isClient
    ? request.technician.user.fullName
    : request.client.fullName;

  await prisma.chatReport.create({
    data: {
      requestId,
      reporterId: session.userId,
      reportedUserId,
      reason,
      details: details || null,
    },
  });

  // Notify every admin and sous-admin, not just one of them.
  const moderators = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SOUS_ADMIN"] } },
    select: { id: true },
  });

  await Promise.all(
    moderators.map(({ id }) =>
      createNotification({
        userId: id,
        type: "CHAT_REPORT",
        title: "New chat report",
        body: `${reporterName} reported ${reportedName}: ${reason}${details ? ` — ${details.slice(0, 120)}` : ""}`,
        requestId,
      })
    )
  );

  revalidatePath(`/requests/${requestId}/chat`);
}
