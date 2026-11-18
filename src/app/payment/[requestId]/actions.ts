"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { updatePaymentMethod } from "@/lib/db/monetization";

export async function confirmPaymentAction(formData: FormData): Promise<void> {
  await requireUser();
  const t = await getT();
  const requestId = String(formData.get("requestId") ?? "");
  const method = String(formData.get("method") ?? "").trim();
  if (!requestId || !method) {
    redirect(`/payment/${requestId}?error=${encodeURIComponent(t("booking.payment.errorChoose"))}`);
  }
  await updatePaymentMethod(requestId, method);
  redirect(`/payment/${requestId}/success`);
}