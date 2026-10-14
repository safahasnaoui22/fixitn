"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { logAudit } from "@/lib/db/audit";
import { PERMISSIONS, PERMISSION_KEYS } from "@/lib/permissions";

// ADMIN only, never grantable: a sous-admin cannot give himself more rights.
export async function updatePermissionsAction(
  userId: string,
  formData: FormData
): Promise<void> {
  const actor = await requireRole("ADMIN");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, fullName: true },
  });
  if (!target || target.role !== "SOUS_ADMIN") redirect("/admin/team");

  // Keep only known keys, ignore anything else a crafted form might send.
  const selected = formData
    .getAll("permissions")
    .map(String)
    .filter((k) => PERMISSION_KEYS.includes(k));

  await prisma.user.update({
    where: { id: userId },
    data: { permissions: selected },
  });

  const labels = PERMISSIONS.filter((p) => selected.includes(p.key)).map((p) => p.label);
  await logAudit(actor, {
    action: "team.permissions",
    entityType: "user",
    entityId: userId,
    summary: `Set access of ${target.fullName}: ${labels.length ? labels.join(", ") : "nothing"}`,
  });

  revalidatePath("/admin/team");
  redirect("/admin/team?saved=1");
}
