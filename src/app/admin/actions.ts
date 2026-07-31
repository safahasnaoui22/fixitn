"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { setTechnicianVerified, deleteUser } from "@/lib/db/admin";

export async function verifyTechnicianAction(technicianId: string, verified: boolean): Promise<void> {
  await requireRole("ADMIN");
  await setTechnicianVerified(technicianId, verified);
  redirect(`/admin/technicians/${technicianId}`);
}

export async function deleteUserAction(userId: string): Promise<void> {
  await requireRole("ADMIN");
  await deleteUser(userId);
  redirect("/admin/users");
}
export async function promoteSeniorAction(
  technicianId: string,
  isSenior: boolean
): Promise<void> {
  await requireRole("ADMIN");
  const { manuallySetSenior } = await import("@/lib/db/planConfig");
  await manuallySetSenior(technicianId, isSenior);
  redirect(`/admin/technicians/${technicianId}`);
}

export async function resetFaceAction(userId: string): Promise<void> {
  await requireRole("ADMIN");
  const { resetFaceDescriptor } = await import("@/lib/db/face");
  await resetFaceDescriptor(userId);
  redirect(`/admin/users/${userId}?success=face-reset`);
}