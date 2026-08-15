"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/client";
import { manuallySetSenior } from "@/lib/db/planConfig";

export async function subscribePlanAction(formData: FormData): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const planId = String(formData.get("planId") ?? "").trim();
  if (!planId) redirect("/plans");

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { key: true },
  });
  if (!plan) redirect("/plans");

  // Update technician plan
  await prisma.technician.update({
    where: { id: technician.id },
    data: { planId },
  });

  // Cancel existing subscriptions and create new one
  await prisma.subscription.updateMany({
    where: { technicianId: technician.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  await prisma.subscription.create({
    data: { technicianId: technician.id, planId, status: "ACTIVE" },
  });

  revalidatePath("/plans");
  revalidatePath("/t/dashboard");
  revalidatePath("/t/profile");
  redirect("/plans?success=1");
}

export async function requestDowngradeAction(): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  if (technician.isSenior) {
    await manuallySetSenior(technician.id, false);
  }

  const beginnerPlan = await prisma.plan.findFirst({
    where: { key: "BEGINNER" },
  });
  if (!beginnerPlan) redirect("/plans");

  await prisma.technician.update({
    where: { id: technician.id },
    data: { planId: beginnerPlan.id },
  });

  await prisma.subscription.updateMany({
    where: { technicianId: technician.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  await prisma.subscription.create({
    data: { technicianId: technician.id, planId: beginnerPlan.id, status: "ACTIVE" },
  });

  revalidatePath("/plans");
  redirect("/plans");
}