"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db/users";
import { createTechnicianProfile } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/client";
import type { Role } from "@/lib/constants";

function fail(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData): Promise<void> {
  const role     = String(formData.get("role")     ?? "CLIENT") as Role;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone    = String(formData.get("phone")    ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const city     = String(formData.get("city")     ?? "").trim() || null;
  const agreed   = String(formData.get("agreed")   ?? "") === "true";

  // ── Validation ─────────────────────────────────────────────────────
  if (!fullName) fail("Veuillez saisir votre nom complet.");
  if (!phone)    fail("Veuillez saisir votre numéro de téléphone.");
  if (password.length < 6)
    fail("Le mot de passe doit contenir au moins 6 caractères.");
  if (!agreed)
    fail("Vous devez accepter les conditions d'utilisation.");

  // ── Duplicate check ────────────────────────────────────────────────
  const existing = await findUserByPhone(phone);
  if (existing)
    fail("Ce numéro est déjà inscrit. Essayez de vous connecter.");

  // ── Technician-specific ────────────────────────────────────────────
  let techInput: {
    title: string;
    bio: string | null;
    yearsExperience: number;
    startingPrice: number;
    categoryIds: string[];
    cinUrl: string | null;
    diplomeUrl: string | null;
    planId: string;
  } | null = null;

  if (role === "TECHNICIAN") {
    const title          = String(formData.get("title") ?? "").trim();
    const bio            = String(formData.get("bio")   ?? "").trim() || null;
    const yearsExperience = Number(formData.get("yearsExperience") ?? 0) || 0;
    const startingPrice   = Number(formData.get("startingPrice")   ?? 0) || 0;

    // categoryIds come from multiple hidden inputs OR checkboxes
    const categoryIds = formData.getAll("categoryIds")
      .map(String)
      .filter(Boolean);

    if (!title)
      fail("Veuillez saisir votre titre professionnel.");
    if (categoryIds.length === 0)
      fail("Veuillez sélectionner au moins un service.");

    // ── Get BEGINNER plan ────────────────────────────────────────────
    const beginnerPlan = await prisma.plan.findFirst({
      where: { key: "BEGINNER" },
    });

    if (!beginnerPlan) {
      // Try any plan as fallback
      const anyPlan = await prisma.plan.findFirst();
      if (!anyPlan) {
        fail(
          "Erreur de configuration: aucun plan disponible. " +
          "Veuillez contacter support@fixili.tn"
        );
      }
      console.warn("[register] BEGINNER plan not found, using:", anyPlan?.key);
    }

    const planId = beginnerPlan?.id
      ?? (await prisma.plan.findFirst())?.id
      ?? "";

    // ── Documents (optional — can be uploaded later from profile) ─────
    let cinUrl: string | null = null;
    let diplomeUrl: string | null = null;

    const cinFile     = formData.get("cin");
    const diplomeFile = formData.get("diplome");

    const hasCloudinary =
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      // Upload if Cloudinary is configured
      if (cinFile instanceof File && cinFile.size > 0) {
        try {
          const { uploadFile } = await import("@/lib/cloudinary");
          const result = await uploadFile(cinFile, "cin");
          cinUrl = result.url;
        } catch (err) {
          console.error("[register] CIN upload failed:", err);
          fail(
            "Échec du téléchargement du CIN. " +
            "Vérifiez votre connexion et réessayez."
          );
        }
      }
      if (diplomeFile instanceof File && diplomeFile.size > 0) {
        try {
          const { uploadFile } = await import("@/lib/cloudinary");
          const result = await uploadFile(diplomeFile, "diplome");
          diplomeUrl = result.url;
        } catch (err) {
          console.error("[register] Diplome upload failed:", err);
          fail(
            "Échec du téléchargement du diplôme. " +
            "Vérifiez votre connexion et réessayez."
          );
        }
      }
    } else {
      // Cloudinary not configured — skip uploads, admin will request later
      console.warn("[register] Cloudinary not configured — skipping document upload");
    }

    techInput = {
      title,
      bio,
      yearsExperience,
      startingPrice,
      categoryIds,
      cinUrl,
      diplomeUrl,
      planId,
    };
  }

  // ── Create user ────────────────────────────────────────────────────
  let user;
  try {
    user = await createUser({ fullName, phone, password, role, city });
  } catch (err) {
    console.error("[register] createUser failed:", err);
    fail("Erreur lors de la création du compte. Réessayez.");
  }

  // ── Create technician profile ─────────────────────────────────────
  if (techInput && user) {
    try {
      const profile = await createTechnicianProfile({
        userId:         user.id,
        title:          techInput.title,
        bio:            techInput.bio,
        yearsExperience: techInput.yearsExperience,
        startingPrice:  techInput.startingPrice,
        categoryIds:    techInput.categoryIds,
        planId:         techInput.planId,
        cinUrl:         techInput.cinUrl,
        diplomeUrl:     techInput.diplomeUrl,
      });

      // Create subscription record
      await prisma.subscription.create({
        data: {
          technicianId: profile.id,
          planId:       techInput.planId,
          status:       "ACTIVE",
        },
      });
    } catch (err) {
      console.error("[register] createTechnicianProfile failed:", err);
      // Delete the user we just created to avoid orphaned records
      await prisma.user.delete({ where: { id: user!.id } }).catch(() => {});
      fail(
        "Erreur lors de la création du profil technicien. " +
        "Contactez support@fixili.tn"
      );
    }
  }

  // ── Issue session ─────────────────────────────────────────────────
  await createSession({
    userId:          user!.id,
    role:            user!.role as Role,
    fullName:        user!.fullName,
    sessionVersion:  0,
    faceSetup:       false,
    deviceVerified:  false,
    accountApproved: role === "TECHNICIAN" ? false : true,
  });

  redirect("/");
}