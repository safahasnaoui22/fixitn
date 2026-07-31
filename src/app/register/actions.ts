"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db/users";
import { createTechnicianProfile } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import { uploadFile } from "@/lib/cloudinary";
import type { Role } from "@/lib/constants";

function fail(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "CLIENT") as Role;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const city = String(formData.get("city") ?? "").trim() || null;

  if (!fullName || !phone || password.length < 6) {
    fail("Fill in your name, phone, and a password of at least 6 characters.");
  }

  const existing = await findUserByPhone(phone);
  if (existing) {
    fail("That phone number is already registered.");
  }

  // --- Technician-only validation ------------------------------------
  let technicianInput: {
    title: string;
    bio: string | null;
    yearsExperience: number;
    startingPrice: number;
    categoryIds: string[];
    cinUrl: string;
    diplomeUrl: string;
  } | null = null;

  if (role === "TECHNICIAN") {
    const title = String(formData.get("title") ?? "").trim();
    const categoryIds = formData.getAll("categoryIds").map(String);
    const cinFile = formData.get("cin");
    const diplomeFile = formData.get("diplome");

    if (!title || categoryIds.length === 0) {
      fail("Add a title and pick at least one service category.");
    }

    if (
      !(cinFile instanceof File) ||
      cinFile.size === 0
    ) {
      fail("Please upload your CIN or passport.");
    }

    if (
      !(diplomeFile instanceof File) ||
      diplomeFile.size === 0
    ) {
      fail("Please upload your diploma or professional certificate.");
    }

    const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB
    if (cinFile.size > MAX_DOC_SIZE) {
      fail("CIN file is too large. Maximum size is 10 MB.");
    }
    if (diplomeFile.size > MAX_DOC_SIZE) {
      fail("Diploma file is too large. Maximum size is 10 MB.");
    }

    // Upload both documents to Cloudinary before creating any DB rows.
    // If upload fails we stop here — no orphaned user records.
    let cinUrl: string;
    let diplomeUrl: string;

    try {
      const [cinResult, diplomeResult] = await Promise.all([
        uploadFile(cinFile, "cin"),
        uploadFile(diplomeFile, "diplome"),
      ]);
      cinUrl = cinResult.url;
      diplomeUrl = diplomeResult.url;
    } catch {
      fail(
        "Failed to upload your documents. Please check your connection and try again."
      );
    }

    technicianInput = {
      title,
      bio: String(formData.get("bio") ?? "").trim() || null,
      yearsExperience: Number(formData.get("yearsExperience") ?? 0) || 0,
      startingPrice: Number(formData.get("startingPrice") ?? 0) || 0,
      categoryIds,
      cinUrl: cinUrl!,
      diplomeUrl: diplomeUrl!,
    };
  }

  // --- Create user ---------------------------------------------------
  const user = await createUser({ fullName, phone, password, role, city });

  // --- Create technician profile ------------------------------------
  if (technicianInput) {
    const plans = await listPlans();
    const beginnerPlan =
      plans.find((p) => p.key === "BEGINNER") ?? plans[0];

    await createTechnicianProfile({
      userId: user.id,
      title: technicianInput.title,
      bio: technicianInput.bio,
      yearsExperience: technicianInput.yearsExperience,
      startingPrice: technicianInput.startingPrice,
      categoryIds: technicianInput.categoryIds,
      planId: beginnerPlan?.id ?? "",
      cinUrl: technicianInput.cinUrl,
      diplomeUrl: technicianInput.diplomeUrl,
    });
  }

  // --- Issue session (with faceSetup:false — middleware gates /face-setup)
  await createSession({
    userId: user.id,
    role: user.role as Role,
    fullName: user.fullName,
    sessionVersion: 0,
    faceSetup: false,      // forces redirect to /face-setup
    deviceVerified: false, // not yet verified
  });

  // Middleware will intercept and redirect to /face-setup
  redirect("/");
}