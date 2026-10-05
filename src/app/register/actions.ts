"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db/users";
import { createTechnicianProfile } from "@/lib/db/catalog";
import { uploadFile } from "@/lib/cloudinary";
import { prisma } from "@/lib/db/client";
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
  const agreed = String(formData.get("agreed") ?? "") === "true";

  // ── Basic validation ───────────────────────────────────────────────
  if (!fullName) fail("Please enter your full name.");
  if (!phone) fail("Please enter your phone number.");
  if (password.length < 6) fail("Password must be at least 6 characters.");

  // ── Agreement check ────────────────────────────────────────────────
  if (!agreed) {
    fail("You must read and agree to the Terms & Conditions before creating an account.");
  }

  // ── Duplicate phone check ──────────────────────────────────────────
  const existing = await findUserByPhone(phone);
  if (existing) {
    fail("That phone number is already registered. Try logging in instead.");
  }

  // ── Technician-specific validation ────────────────────────────────
  let technicianInput: {
    title: string;
    bio: string | null;
    yearsExperience: number;
    startingPrice: number;
    categoryIds: string[];
    cinUrl: string;
    diplomeUrl: string;
    planId: string;
  } | null = null;

  if (role === "TECHNICIAN") {
    const title = String(formData.get("title") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim() || null;
    const yearsExperience = Number(formData.get("yearsExperience") ?? 0) || 0;
    const startingPrice = Number(formData.get("startingPrice") ?? 0) || 0;
    const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);

    if (!title) fail("Please add a professional title.");
    if (categoryIds.length === 0) {
      fail("Please select at least one service category.");
    }

    // Document validation
    const cinFile = formData.get("cin");
    const diplomeFile = formData.get("diplome");

    if (!(cinFile instanceof File) || cinFile.size === 0) {
      fail("Please upload your CIN or passport document.");
    }
    if (!(diplomeFile instanceof File) || diplomeFile.size === 0) {
      fail("Please upload your diploma or professional certificate.");
    }

    const MAX_DOC_SIZE = 2 * 1024 * 1024; // 2 MB (two files share one request; hosts cap the body at ~4.5 MB)
    if ((cinFile as File).size > MAX_DOC_SIZE) {
      fail("CIN file is too large. Maximum size is 2 MB.");
    }
    if ((diplomeFile as File).size > MAX_DOC_SIZE) {
      fail("Diploma file is too large. Maximum size is 2 MB.");
    }

    const ACCEPTED_TYPES = [
      "image/jpeg", "image/png", "image/webp", "application/pdf",
    ];
    if (!ACCEPTED_TYPES.includes((cinFile as File).type)) {
      fail("CIN file must be JPG, PNG, WebP, or PDF.");
    }
    if (!ACCEPTED_TYPES.includes((diplomeFile as File).type)) {
      fail("Diploma file must be JPG, PNG, WebP, or PDF.");
    }

    // Upload documents to Cloudinary before creating any DB records.
    // If upload fails here, no orphaned user is created.
    let cinUrl: string;
    let diplomeUrl: string;



    try {
  const [cinResult, diplomeResult] = await Promise.all([
    uploadFile(cinFile as File, "cin"),
    uploadFile(diplomeFile as File, "diplome"),
  ]);
  cinUrl = cinResult.url;
  diplomeUrl = diplomeResult.url;
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  console.error("[Register] Document upload error:", msg);
  fail(
    msg.includes("environment variables")
      ? "Document storage is not configured. Contact support."
      : "Failed to upload your documents. Please try again with a JPG or PNG file under 2 MB."
  );
}

    // Get Beginner plan (default for all new registrations)
    const beginnerPlan = await prisma.plan.findFirst({
      where: { key: "BEGINNER" },
    });
    if (!beginnerPlan) {
      fail("Platform configuration error. Please contact support.");
    }

    technicianInput = {
      title,
      bio,
      yearsExperience,
      startingPrice,
      categoryIds,
      cinUrl: cinUrl!,
      diplomeUrl: diplomeUrl!,
      planId: beginnerPlan!.id,
    };
  }

  // ── Create user ────────────────────────────────────────────────────
  const user = await createUser({ fullName, phone, password, role, city });

  // ── Create technician profile (status = PENDING automatically) ─────
  if (technicianInput) {
    const profile = await createTechnicianProfile({
      userId: user.id,
      title: technicianInput.title,
      bio: technicianInput.bio,
      yearsExperience: technicianInput.yearsExperience,
      startingPrice: technicianInput.startingPrice,
      categoryIds: technicianInput.categoryIds,
      planId: technicianInput.planId,
      cinUrl: technicianInput.cinUrl,
      diplomeUrl: technicianInput.diplomeUrl,
      // accountStatus defaults to "PENDING" inside createTechnicianProfile
    });

    // Create subscription record for the Beginner plan
    await prisma.subscription.create({
      data: {
        technicianId: profile.id,
        planId: technicianInput.planId,
        status: "ACTIVE",
      },
    });
  }

  // ── Issue initial session ──────────────────────────────────────────
  // faceSetup: false  → middleware redirects to /face-setup
  // deviceVerified: false → will be set after face scan
  // accountApproved: false for PENDING technicians → middleware
  //   redirects to /t/pending after face setup is complete
  await createSession({
    userId: user.id,
    role: user.role as Role,
    fullName: user.fullName,
    sessionVersion: 0,
    faceSetup: false,
    deviceVerified: false,
    accountApproved: role === "TECHNICIAN" ? false : true,
  });

  // Middleware intercepts and sends to /face-setup
  redirect("/");
}