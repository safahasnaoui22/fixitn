"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db/users";
import { createTechnicianProfile } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/client";
import { uploadFile } from "@/lib/cloudinary";
import type { Role } from "@/lib/constants";

function fail(message: string): never {
  redirect(
    `/admin/create-account?error=${encodeURIComponent(message)}`
  );
}

export async function adminCreateAccountAction(
  formData: FormData
): Promise<void> {
  await requireRole("ADMIN");

  const role = String(formData.get("role") ?? "CLIENT") as Role;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const city = String(formData.get("city") ?? "").trim() || null;
  const planId = String(formData.get("planId") ?? "").trim() || null;

  if (!fullName || !phone || password.length < 6) {
    fail(
      "Fill in name, phone, and a password of at least 6 characters."
    );
  }

  const existing = await findUserByPhone(phone);
  if (existing) fail("That phone number is already registered.");

  // Create the base user
  const user = await createUser({ fullName, phone, password, role, city });

  // Technician-specific setup
  if (role === "TECHNICIAN") {
    const title =
      String(formData.get("title") ?? "").trim() || "Technician";
    const categoryIds = formData.getAll("categoryIds").map(String);
    const yearsExperience =
      Number(formData.get("yearsExperience") ?? 0) || 0;
    const startingPrice =
      Number(formData.get("startingPrice") ?? 0) || 0;

    // Resolve plan — admin picks freely
    let resolvedPlanId = planId;
    if (!resolvedPlanId) {
      const beginnerPlan = await prisma.plan.findFirst({
        where: { key: "BEGINNER" },
      });
      resolvedPlanId = beginnerPlan?.id ?? "";
    }

    // Handle optional document uploads
    let cinUrl: string | null = null;
    let diplomeUrl: string | null = null;
    const cinFile = formData.get("cin");
    const diplomeFile = formData.get("diplome");

    if (cinFile instanceof File && cinFile.size > 0) {
      const result = await uploadFile(cinFile, "cin");
      cinUrl = result.url;
    }
    if (diplomeFile instanceof File && diplomeFile.size > 0) {
      const result = await uploadFile(diplomeFile, "diplome");
      diplomeUrl = result.url;
    }

    const profile = await createTechnicianProfile({
      userId: user.id,
      title,
      yearsExperience,
      startingPrice,
      categoryIds,
      planId: resolvedPlanId,
      cinUrl,
      diplomeUrl,
    });

    // Admin-created accounts are auto-approved
    await prisma.technician.update({
      where: { id: profile.id },
      data: { accountStatus: "ACTIVE" },
    });

    // Apply the chosen plan via subscription
    if (resolvedPlanId) {
      await prisma.subscription.create({
        data: {
          technicianId: profile.id,
          planId: resolvedPlanId,
          status: "ACTIVE",
        },
      });
    }
  }

  // Sous-admin setup — no extra profile needed
  // Admin can create sous-admin accounts the same way

  redirect("/admin/create-account?success=1");
}