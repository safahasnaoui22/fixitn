"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import { resetUserFace } from "@/lib/db/security";

/** ADMIN only. Clears the face of one account so the person must enrol again. */
export async function resetFaceAction(userId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });
  if (!user) return;
  await resetUserFace(userId, actor.fullName);
  await logAudit(actor, {
    action: "user.faceReset",
    entityType: "user",
    entityId: userId,
    summary: `Reset face of ${user.fullName}`,
  });
  revalidatePath("/admin/security");
  revalidatePath("/admin/users");
}
