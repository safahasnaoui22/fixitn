"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasFaceDescriptor } from "@/lib/db/face";

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

// skipFaceSetupAction is REMOVED — no role can bypass face verification
// Admin, client, technician — everyone must register their face