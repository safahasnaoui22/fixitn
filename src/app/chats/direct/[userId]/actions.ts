"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";
import { i18nText } from "@/lib/i18n/translate";

export async function sendClientDirectMessageAction(
  toUserId: string,
  formData: FormData
): Promise<void> {
  const session = await requireRole("CLIENT");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return;

  const other = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { role: true },
  });
  if (!other || other.role !== "TECHNICIAN") return;

  await sendSupportMessage(session.userId, toUserId, body);
  await createNotification({
    userId: toUserId,
    type: "NEW_MESSAGE",
    title: i18nText("client.notif.directMessage.title", { name: session.fullName }),
    body: body.slice(0, 80),
    requestId: null,
    url: `/t/messages/${session.userId}`,
  });
  revalidatePath(`/chats/direct/${toUserId}`);
}
