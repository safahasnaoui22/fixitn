"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";
import { findUserById } from "@/lib/db/users";

export async function sendAdminMessageAction(
  adminId: string,
  toUserId: string,
  formData: FormData
): Promise<void> {
  const session = await requireRole("ADMIN");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await sendSupportMessage(adminId, toUserId, body);

  const toUser = await findUserById(toUserId);
  if (toUser) {
    await createNotification({
      userId: toUserId,
      type: "NEW_MESSAGE",
      title: `💬 Message de l'administrateur`,
      body: body.slice(0, 80),
      requestId: null,
    });
  }

  revalidatePath(`/admin/messages/${toUserId}`);
}