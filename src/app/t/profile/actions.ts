"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { destroySession } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getTechnicianByUserId, updateTechnicianProfile } from "@/lib/db/catalog";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/onboarding");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const t = await getT();
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const yearsExperience = Number(formData.get("yearsExperience") ?? 0) || 0;
  const startingPrice = Number(formData.get("startingPrice") ?? 0) || 0;

  if (!title) redirect("/t/profile?error=" + encodeURIComponent(t("tech.profile.titleRequired")));

  await updateTechnicianProfile(technician.id, { title, bio, yearsExperience, startingPrice });
  redirect("/t/profile?success=1");
}