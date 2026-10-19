"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/db/audit";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/db/notifications";

const AUDIENCES = ["CLIENTS", "TECHNICIANS", "SENIORS", "EVERYONE"] as const;

export async function sendBroadcastAction(
  formData: FormData
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  const actor = await requireRole("ADMIN");
  const audience = String(formData.get("audience") ?? "") as (typeof AUDIENCES)[number];
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const body = String(formData.get("body") ?? "").trim().slice(0, 300);
  if (!AUDIENCES.includes(audience)) return { ok: false, error: "Choose who receives it." };
  if (!title || !body) return { ok: false, error: "Title and message are required." };

  const where =
    audience === "CLIENTS"
      ? { role: "CLIENT" }
      : audience === "TECHNICIANS"
        ? { role: "TECHNICIAN" }
        : audience === "SENIORS"
          ? { role: "TECHNICIAN", technician: { is: { isSenior: true, accountStatus: "ACTIVE" } } }
          : { role: { in: ["CLIENT", "TECHNICIAN"] } };

  const users = await prisma.user.findMany({ where, select: { id: true }, take: 5000 });

  // small batches: each one writes the in-app notification AND sends the push
  const BATCH = 25;
  for (let i = 0; i < users.length; i += BATCH) {
    await Promise.allSettled(
      users.slice(i, i + BATCH).map((u) =>
        createNotification({ userId: u.id, type: "STATUS_UPDATE", title, body })
      )
    );
  }

  await prisma.broadcast.create({
    data: { audience, title, body, sentCount: users.length, createdByName: actor.fullName },
  });
  await logAudit(actor, {
    action: "broadcast.send",
    entityType: "user",
    entityId: "broadcast",
    summary: `Broadcast to ${audience} (${users.length}): ${title}`,
  });
  revalidatePath("/admin/broadcast");
  return { ok: true, sent: users.length };
}
