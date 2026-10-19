import { prisma } from "./client";
import { resetFaceDescriptor } from "./face";
import { bumpSessionVersion } from "./users";

export const SECURITY_TYPES = [
  "FACE_FAIL",
  "FACE_SHARED",
  "NEW_DEVICE",
  "FORCED_LOGOUT",
  "FACE_RESET",
  "LOGIN_FAIL",
] as const;
export type SecurityType = (typeof SECURITY_TYPES)[number];

export const SECURITY_LABEL: Record<SecurityType, string> = {
  FACE_FAIL: "Face check failed",
  FACE_SHARED: "Face shared by several accounts",
  NEW_DEVICE: "Login from a new device",
  FORCED_LOGOUT: "Old device signed out",
  FACE_RESET: "Face reset by admin",
  LOGIN_FAIL: "Wrong password",
};

/** Write one security event. Never throws: logging must not break a login. */
export async function logSecurityEvent(e: {
  type: SecurityType;
  userId?: string | null;
  userName?: string | null;
  detail?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    let userName = e.userName ?? null;
    if (!userName && e.userId) {
      const u = await prisma.user.findUnique({
        where: { id: e.userId },
        select: { fullName: true },
      });
      userName = u?.fullName ?? null;
    }
    await prisma.securityEvent.create({
      data: {
        type: e.type,
        userId: e.userId ?? null,
        userName,
        detail: e.detail ?? null,
        userAgent: e.userAgent?.slice(0, 300) ?? null,
      },
    });
  } catch (err) {
    console.error("[security] failed to log event", err);
  }
}

export async function listSecurityEvents(type?: string, limit = 150) {
  return prisma.securityEvent.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function securitySummary24h(): Promise<Record<SecurityType, number>> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const rows = await prisma.securityEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const out = Object.fromEntries(SECURITY_TYPES.map((t) => [t, 0])) as Record<SecurityType, number>;
  for (const r of rows) {
    if (r.type in out) out[r.type as SecurityType] = r._count._all;
  }
  return out;
}

/** Accounts with their face / device status (for the "Accounts" table + search). */
export async function listAccountsForSecurity(q?: string, limit = 40) {
  const term = (q ?? "").trim();
  const users = await prisma.user.findMany({
    where: term
      ? {
          OR: [
            { fullName: { contains: term, mode: "insensitive" } },
            { phone: { contains: term } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      faceDescriptor: true,
      _count: { select: { knownDevices: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    hasFace: !!u.faceDescriptor,
    devices: u._count.knownDevices,
  }));
}

/**
 * Admin "Reset face": clears the stored face + known devices and signs the user
 * out everywhere. At the next login the person must enrol a face again
 * (the one-face-one-account rule is checked again at that moment).
 */
export async function resetUserFace(userId: string, actorName: string): Promise<void> {
  await resetFaceDescriptor(userId);
  await bumpSessionVersion(userId);
  await logSecurityEvent({
    type: "FACE_RESET",
    userId,
    detail: `Reset by ${actorName}`,
  });
}
