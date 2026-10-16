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
import { isTechnicianApproved } from "@/lib/db/technicianApproval";
import type { Role } from "@/lib/constants";

// SECURITY POLICY (set to false to go back to "trusted device skips the face scan"):
// true  = EVERY login (after a logout, or on another device) must pass the face
//         check before the session is created.
// false = a device that already passed the face check once logs in directly.
const ALWAYS_VERIFY_FACE = true;

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

  // ── Face setup check ───────────────────────────────────────────────
  const hasFace = await hasFaceDescriptor(user.id);

  // SINGLE DEVICE ENFORCEMENT: bumping sessionVersion logs the user out of
  // every other device. We bump only when this login is really completed:
  //  - no face yet  → right now (nothing else to prove)
  //  - face check   → in /api/face/verify, AFTER the face matched
  // (so someone who only knows the password cannot kick the real owner out).

  if (!hasFace) {
    const newVersion = await bumpSessionVersion(user.id);
    // Account exists but face never set up → send to face-setup
    await createSession({
      userId: user.id,
      role: user.role as Role,
      fullName: user.fullName,
      sessionVersion: newVersion,
      faceSetup: false,
      deviceVerified: false,
      accountApproved:
        user.role === "TECHNICIAN"
          ? await isTechnicianApproved(user.id)
          : true,
    });
    redirect("/face-setup");
  }

  // ── Device check ───────────────────────────────────────────────────
  const knownDevice =
    !ALWAYS_VERIFY_FACE &&
    deviceToken.length > 10 &&
    (await isKnownDevice(user.id, deviceToken));

  if (knownDevice) {
    const newVersion = await bumpSessionVersion(user.id);
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
    sessionVersion: user.sessionVersion ?? 0,
  });

  redirect("/face-verify");
}