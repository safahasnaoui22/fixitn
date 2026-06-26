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