"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";

export async function sendSupportMessageAction(
  sousAdminId: string,
  toUserId: string,
  formData: FormData
): Promise<void> {
  const session = await requirePermission("support");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await sendSupportMessage(sousAdminId, toUserId, body);

  // Notify the recipient
  await createNotification({
    userId: toUserId,
    type: "NEW_MESSAGE",
    title: "New support message",
    body: body.slice(0, 80),
    requestId: null,
  });

  revalidatePath(`/sous-admin/support/${toUserId}`);
  revalidatePath("/sous-admin/support");
}