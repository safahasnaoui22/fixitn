"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendSupportMessage } from "@/lib/db/supportChat";
import { createNotification } from "@/lib/db/notifications";

export async function sendSupportMessageAction(
  sousAdminId: string,
  toUserId: string,
  formData: FormData
): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SOUS_ADMIN") redirect("/login");

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