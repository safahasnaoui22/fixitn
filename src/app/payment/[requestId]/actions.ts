"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { updatePaymentMethod } from "@/lib/db/monetization";

export async function confirmPaymentAction(formData: FormData): Promise<void> {
  await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const method = String(formData.get("method") ?? "").trim();
  if (!requestId || !method) {
    redirect(`/payment/${requestId}?error=Please+choose+a+payment+method.`);
  }
  await updatePaymentMethod(requestId, method);
  redirect(`/payment/${requestId}/success`);
}