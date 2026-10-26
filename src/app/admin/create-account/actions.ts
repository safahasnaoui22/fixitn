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
  const planId: string | null = String(formData.get("planId") ?? "").trim() || null;

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
    let errorMessage: string | null = null;

    try {
      const title =
        String(formData.get("title") ?? "").trim() || "Technician";
      const requestedCategoryIds = formData.getAll("categoryIds").map(String);
      const yearsExperience =
        Number(formData.get("yearsExperience") ?? 0) || 0;
      const startingPrice =
        Number(formData.get("startingPrice") ?? 0) || 0;

      // Keep only categories that really exist
      const validCategories = requestedCategoryIds.length
        ? await prisma.category.findMany({
            where: { id: { in: requestedCategoryIds } },
            select: { id: true },
          })
        : [];
      const categoryIds = validCategories.map((c) => c.id);

      // Resolve plan — admin picks freely, else Beginner, else any plan
      let resolvedPlanId = planId;
      if (!resolvedPlanId) {
        const beginnerPlan =
          (await prisma.plan.findFirst({ where: { key: "BEGINNER" } })) ??
          (await prisma.plan.findFirst());
        resolvedPlanId = beginnerPlan?.id ?? null;
      }
      if (!resolvedPlanId) {
        throw new Error("No plan exists yet. Create a plan first.");
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
      await prisma.subscription.create({
        data: {
          technicianId: profile.id,
          planId: resolvedPlanId,
          status: "ACTIVE",
        },
      });
    } catch (err) {
      console.error("[create-account] technician setup failed", err);
      errorMessage = err instanceof Error ? err.message : "Unknown error";
      // do not leave a half-created account behind
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    }

    if (errorMessage) {
      fail(`Could not create the technician: ${errorMessage.slice(0, 180)}`);
    }
  }

  // Sous-admin setup — no extra profile needed
  // Admin can create sous-admin accounts the same way

  redirect("/admin/create-account?success=1");
}