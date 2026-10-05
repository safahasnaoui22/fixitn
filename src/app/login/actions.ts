"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  createPendingSession,
  verifyPassword,
} from "@/lib/auth";
import { findUserByPhone, bumpSessionVersion } from "@/lib/db/users";
import { hasFaceDescriptor, isKnownDevice } from "@/lib/db/face";
import { prisma } from "@/lib/db/client";
import type { Role } from "@/lib/constants";

function homeFor(role: string): string {
  if (role === "TECHNICIAN") return "/t/dashboard";
  if (role === "ADMIN") return "/admin";
  if (role === "SOUS_ADMIN") return "/sous-admin";
  return "/";
}

export async function loginAction(formData: FormData): Promise<void> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const deviceToken = String(formData.get("deviceToken") ?? "").trim();

  if (!phone || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Veuillez saisir votre numéro et mot de passe.")}`
    );
  }

  // ── Credentials check ──────────────────────────────────────────────
  const user = await findUserByPhone(phone);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(
      `/login?error=${encodeURIComponent("Numéro ou mot de passe incorrect.")}`
    );
  }

  // ── SINGLE DEVICE ENFORCEMENT ──────────────────────────────────────
  // Bump sessionVersion — this immediately invalidates ALL existing sessions
  // for this user on every other device. Their next request will fail the
  // version check in requireUser() and they'll be logged out.
  const newVersion = await bumpSessionVersion(user.id);

  // ── Face setup check ───────────────────────────────────────────────
  const hasFace = await hasFaceDescriptor(user.id);

  if (!hasFace) {
    // Account exists but face never set up → send to face-setup
    await createSession({
      userId: user.id,
      role: user.role as Role,
      fullName: user.fullName,
      sessionVersion: newVersion,
      faceSetup: false,
      deviceVerified: false,
      accountApproved: user.role === "TECHNICIAN" ? false : true,
    });
    redirect("/face-setup");
  }

  // ── Device check ───────────────────────────────────────────────────
  const knownDevice =
    deviceToken.length > 10 &&
    (await isKnownDevice(user.id, deviceToken));

  if (knownDevice) {
    // Known device — face already verified before — full session immediately
    // Check technician approval status
    let accountApproved: boolean | undefined = true;
    if (user.role === "TECHNICIAN") {
      const tech = await prisma.technician.findUnique({
        where: { userId: user.id },
        select: { accountStatus: true },
      });
      accountApproved = tech?.accountStatus === "ACTIVE";
    }

    await createSession({
      userId: user.id,
      role: user.role as Role,
      fullName: user.fullName,
      sessionVersion: newVersion,
      faceSetup: true,
      deviceVerified: true,
      accountApproved,
    });
    redirect(homeFor(user.role));
  }

  // ── Unknown device — face verification required ────────────────────
  // Create a short-lived pending session (15 min) and redirect to /face-verify
  // where the user must scan their face to prove identity before getting access.
  await createPendingSession({
    pendingUserId: user.id,
    pendingFullName: user.fullName,
    pendingRole: user.role as Role,
    sessionVersion: newVersion,
  });

  redirect("/face-verify");
}