"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  createPendingSession,
  verifyPassword,
} from "@/lib/auth";
import { findUserByPhone, bumpSessionVersion } from "@/lib/db/users";
import { hasFaceDescriptor, isKnownDevice } from "@/lib/db/face";
import type { Role } from "@/lib/constants";

function homeFor(role: string): string {
  if (role === "TECHNICIAN") return "/t/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export async function loginAction(formData: FormData): Promise<void> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const deviceToken = String(formData.get("deviceToken") ?? "").trim();

  if (!phone || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Enter your phone and password.")}`
    );
  }

  const user = await findUserByPhone(phone);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(
      `/login?error=${encodeURIComponent("Incorrect phone or password.")}`
    );
  }

  // Bump sessionVersion — invalidates all existing sessions on other devices
  const newVersion = await bumpSessionVersion(user.id);

  const hasFace = await hasFaceDescriptor(user.id);

  // No face registered yet → send to face-setup (new account or old account)
  if (!hasFace) {
    await createSession({
      userId: user.id,
      role: user.role as Role,
      fullName: user.fullName,
      sessionVersion: newVersion,
      faceSetup: false,      // middleware gates → /face-setup
      deviceVerified: false,
    });
    redirect("/face-setup");
  }

  // Known device → full session, no face check needed
  const knownDevice =
    deviceToken.length > 0 && (await isKnownDevice(user.id, deviceToken));

  if (knownDevice) {
    await createSession({
      userId: user.id,
      role: user.role as Role,
      fullName: user.fullName,
      sessionVersion: newVersion,
      faceSetup: true,
      deviceVerified: true,
    });
    redirect(homeFor(user.role));
  }

  // Unknown device + face registered → pending session → /face-verify
  await createPendingSession({
    pendingUserId: user.id,
    pendingFullName: user.fullName,
    pendingRole: user.role as Role,
    sessionVersion: newVersion,
  });
  redirect("/face-verify");
}