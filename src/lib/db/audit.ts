import { prisma } from "./client";

export interface AuditActor {
  userId: string;
  role: string;
  fullName: string;
}

/** Write one audit row. Never throws: a logging problem must not block the action. */
export async function logAudit(
  actor: AuditActor,
  entry: { action: string; entityType: string; entityId: string; summary: string }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.userId,
        actorName: actor.fullName,
        actorRole: actor.role,
        ...entry,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}

export interface LastChange {
  actorName: string;
  actorRole: string;
  summary: string;
  createdAt: Date;
}

/** Latest change per entity id (one query for a whole list). */
export async function getLastChanges(
  entityType: string,
  ids: string[]
): Promise<Map<string, LastChange>> {
  const map = new Map<string, LastChange>();
  if (ids.length === 0) return map;
  const rows = await prisma.auditLog.findMany({
    where: { entityType, entityId: { in: ids } },
    orderBy: { createdAt: "desc" },
  });
  for (const r of rows) {
    if (!map.has(r.entityId)) {
      map.set(r.entityId, {
        actorName: r.actorName,
        actorRole: r.actorRole,
        summary: r.summary,
        createdAt: r.createdAt,
      });
    }
  }
  return map;
}

export async function listRecentAudit(limit = 100) {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
