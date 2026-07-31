"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { manuallySetSenior } from "@/lib/db/planConfig";

/**
 * Senior Pro is auto-granted — technicians cannot manually subscribe.
 * The only manual action is a voluntary downgrade back to Beginner,
 * which removes the Senior badge and reverts the commission rate.
 */
export async function requestDowngradeAction(): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  if (!technician.isSenior) {
    redirect("/plans"); // already on Beginner, nothing to do
  }

  await manuallySetSenior(technician.id, false);
  revalidatePath("/plans");
  revalidatePath("/t/profile");
  redirect("/plans");
}