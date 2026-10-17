import { prisma } from "./client";

// ── Face descriptor ────────────────────────────────────────────────────

export async function saveFaceDescriptor(
  userId: string,
  descriptor: number[]
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { faceDescriptor: JSON.stringify(descriptor) },
  });
}

export async function getFaceDescriptor(
  userId: string
): Promise<number[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { faceDescriptor: true },
  });
  if (!user?.faceDescriptor) return null;
  try {
    return JSON.parse(user.faceDescriptor) as number[];
  } catch {
    return null;
  }
}

export async function hasFaceDescriptor(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { faceDescriptor: true },
  });
  return !!user?.faceDescriptor;
}

export async function resetFaceDescriptor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { faceDescriptor: null },
  });
  await prisma.knownDevice.deleteMany({ where: { userId } });
}

/**
 * Returns ALL stored face descriptors EXCEPT the given userId.
 * Used by /api/face/save to block one person from creating multiple accounts.
 */
export async function getAllFaceDescriptors(
  excludeUserId?: string
): Promise<Array<{ userId: string; descriptor: number[] }>> {
  const users = await prisma.user.findMany({
    where: {
      faceDescriptor: { not: null },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, faceDescriptor: true },
  });

  const result: Array<{ userId: string; descriptor: number[] }> = [];
  for (const u of users) {
    if (!u.faceDescriptor) continue;
    try {
      const parsed = JSON.parse(u.faceDescriptor) as number[];
      if (Array.isArray(parsed) && parsed.length === 128) {
        result.push({ userId: u.id, descriptor: parsed });
      }
    } catch {
      // skip corrupted descriptors
    }
  }
  return result;
}

// ── Known devices ──────────────────────────────────────────────────────

export async function saveKnownDevice(
  userId: string,
  deviceToken: string,
  userAgent?: string
): Promise<void> {
  await prisma.knownDevice.upsert({
    where: { deviceToken },
    update: { userId, lastSeenAt: new Date(), userAgent: userAgent ?? null },
    create: { userId, deviceToken, userAgent: userAgent ?? null },
  });
}

export async function isKnownDevice(
  userId: string,
  deviceToken: string
): Promise<boolean> {
  if (!deviceToken) return false;
  const device = await prisma.knownDevice.findFirst({
    where: { userId, deviceToken },
  });
  return !!device;
}

export async function removeKnownDevice(deviceToken: string): Promise<void> {
  await prisma.knownDevice.deleteMany({ where: { deviceToken } });
}

export async function removeAllUserDevices(userId: string): Promise<void> {
  await prisma.knownDevice.deleteMany({ where: { userId } });
}

export async function listUserDevices(userId: string) {
  const devices = await prisma.knownDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });
  return devices.map((d) => ({
    id: d.id,
    deviceToken: d.deviceToken,
    userAgent: d.userAgent,
    createdAt: d.createdAt.toISOString(),
    lastSeenAt: d.lastSeenAt.toISOString(),
  }));
}

// ── ONE FACE = ONE ACCOUNT (do not remove, do not loosen) ─────────────────
// Distance under which two descriptors are considered the SAME PERSON.
// It is deliberately a bit LOOSER than the login threshold (0.5): a person who
// can log in with face A must never be able to enrol as a "new" face B.
export const SAME_PERSON_THRESHOLD = 0.55;

function faceDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/**
 * Returns the id of ANOTHER account that already owns this face (closest one
 * under SAME_PERSON_THRESHOLD), or null if the face belongs to nobody else.
 * There is NO bypass (no env flag, no dev mode) on purpose.
 */
export async function findOtherAccountWithFace(
  descriptor: number[],
  excludeUserId: string
): Promise<{ userId: string; distance: number } | null> {
  const others = await getAllFaceDescriptors(excludeUserId);
  let best: { userId: string; distance: number } | null = null;
  for (const o of others) {
    const d = faceDistance(descriptor, o.descriptor);
    if (d < SAME_PERSON_THRESHOLD && (!best || d < best.distance)) {
      best = { userId: o.userId, distance: d };
    }
  }
  return best;
}

export const FACE_SHARED_MESSAGE =
  "Ce visage est déjà lié à un autre compte Fixili. Chaque personne ne peut avoir qu'un seul compte. " +
  "Contactez support@fixili.tn.";
