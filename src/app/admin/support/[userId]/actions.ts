"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";
import { i18nText } from "@/lib/i18n/translate";

export async function sendAdminSupportMessageAction(
  adminId: string,
  toUserId: string,
  formData: FormData
): Promise<void> {
  await requireRole("ADMIN");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await sendSupportMessage(adminId, toUserId, body);

  await createNotification({
    userId: toUserId,
    type: "NEW_MESSAGE",
    title: i18nText("adminSup.notif.supportReply.title"),
    body: body.slice(0, 80),
    requestId: null,
  });

  revalidatePath(`/admin/support/${toUserId}`);
  revalidatePath("/admin/support");
}