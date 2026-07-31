"use server";

import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/auth";
import { hasFaceDescriptor } from "@/lib/db/face";

/**
 * Called when an ADMIN account skips face setup.
 * Admins operate from trusted devices so face verification is optional.
 * Regular users and technicians cannot skip.
 */
export async function skipFaceSetupAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only admins may skip
  if (session.role !== "ADMIN") {
    redirect("/face-setup");
  }

  // Re-issue session marking face as setup + device as verified
  // so middleware lets them through without actually storing a descriptor
  await createSession({
    userId: session.userId,
    role: session.role,
    fullName: session.fullName,
    sessionVersion: session.sessionVersion ?? 0,
    faceSetup: true,
    deviceVerified: true,
  });

  redirect("/admin");
}

/**
 * Server-side check — did this user already register a face?
 * Used by the face-setup page to decide whether to show intro or
 * redirect immediately (e.g. user navigated here manually after setup).
 */
export async function getFaceSetupStatus(): Promise<{
  userId: string;
  role: string;
  alreadySetup: boolean;
}> {
  const session = await getSession();
  if (!session) redirect("/login");

  const alreadySetup = await hasFaceDescriptor(session.userId);

  return {
    userId: session.userId,
    role: session.role,
    alreadySetup,
  };
}