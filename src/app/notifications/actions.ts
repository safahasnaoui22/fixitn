"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/db/notifications";

export async function markAllReadAction(): Promise<void> {
  const session = await requireUser();
  await markAllNotificationsRead(session.userId);
  revalidatePath("/notifications");
}