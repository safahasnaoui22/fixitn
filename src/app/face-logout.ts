"use server";

import { redirect } from "next/navigation";
import { destroySession, destroyPendingSession } from "@/lib/auth";

/**
 * "Back to login" from the Face ID pages.
 * It is a server action (not an /api call) on purpose: a user who is half-way
 * through face setup / verification is blocked by the middleware everywhere
 * except on the face pages, and a server action runs on the page itself.
 */
export async function faceLogoutAction(): Promise<void> {
  await destroySession();
  await destroyPendingSession();
  redirect("/login");
}
