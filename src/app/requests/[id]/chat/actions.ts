"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createMessage } from "@/lib/db/requests";

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