"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isActiveSenior, postSeniorMessage } from "@/lib/db/seniorChat";

export async function sendSeniorMessageAction(formData: FormData): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  if (!(await isActiveSenior(session.userId))) return;

  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!body) return;

  await postSeniorMessage(session.userId, session.fullName, body);
  revalidatePath("/t/senior");
}
