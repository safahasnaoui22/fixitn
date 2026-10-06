"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";

export async function sendTechMessageAction(
  techUserId: string,
  toUserId: string,
  formData: FormData
): Promise<void> {
  const session = await requireRole("TECHNICIAN");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await sendSupportMessage(techUserId, toUserId, body);

  await createNotification({
    userId: toUserId,
    type: "NEW_MESSAGE",
    title: `💬 Message de ${session.fullName}`,
    body: body.slice(0, 80),
    requestId: null,
  });

  revalidatePath(`/t/messages/${toUserId}`);
}