"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { getTechnicianEarnings, createWithdrawalRequest } from "@/lib/db/monetization";

export async function requestPayoutAction(formData: FormData): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const method = String(formData.get("method") ?? "").trim();
  if (!method) redirect("/t/payout?error=Please+choose+a+payment+method.");

  const earnings = await getTechnicianEarnings(technician.id);
  if (earnings.total <= 0) redirect("/t/payout?error=No+balance+available+to+withdraw.");

  await createWithdrawalRequest(technician.id, earnings.total, method);
  redirect("/t/payout/history?success=1");
}