
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
 * Returns all stored face descriptors except the specified user.
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

  for (const user of users) {
    if (!user.faceDescriptor) continue;

    try {
      const parsed = JSON.parse(user.faceDescriptor) as number[];

      if (
        Array.isArray(parsed) &&
        parsed.length === 128 &&
        parsed.every((value) => typeof value === "number" && Number.isFinite(value))
      ) {
        result.push({
          userId: user.id,
          descriptor: parsed,
        });
      }
    } catch {
      // Skip corrupted descriptors.
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
    update: {
      userId,
      lastSeenAt: new Date(),
      userAgent: userAgent ?? null,
    },
    create: {
      userId,
      deviceToken,
      userAgent: userAgent ?? null,
    },
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
  await prisma.knownDevice.deleteMany({
    where: { deviceToken },
  });
}

export async function removeAllUserDevices(userId: string): Promise<void> {
  await prisma.knownDevice.deleteMany({
    where: { userId },
  });
}

export async function listUserDevices(userId: string) {
  const devices = await prisma.knownDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });

  return devices.map((device) => ({
    id: device.id,
    deviceToken: device.deviceToken,
    userAgent: device.userAgent,
    createdAt: device.createdAt.toISOString(),
    lastSeenAt: device.lastSeenAt.toISOString(),
  }));
}

// ── ONE FACE = ONE ACCOUNT ─────────────────────────────────────────────

// Distance threshold for identifying the same person.
export const SAME_PERSON_THRESHOLD = 0.55;

function faceDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;

  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }

  return Math.sqrt(sum);
}

/**
 * Returns another account that already owns this face, or null.
 *
 * Local development: duplicate faces are allowed.
 * Production: duplicate-face protection remains enabled.
 */
export async function findOtherAccountWithFace(
  descriptor: number[],
  excludeUserId: string
): Promise<{ userId: string; distance: number } | null> {
  // Allow duplicate faces only when NODE_ENV is development.
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const others = await getAllFaceDescriptors(excludeUserId);

  let best: { userId: string; distance: number } | null = null;

  for (const other of others) {
    const distance = faceDistance(descriptor, other.descriptor);

    if (
      distance < SAME_PERSON_THRESHOLD &&
      (!best || distance < best.distance)
    ) {
      best = {
        userId: other.userId,
        distance,
      };
    }
  }

  return best;
}

export const FACE_SHARED_MESSAGE =
  "Ce visage est déjà lié à un autre compte Fixili. Chaque personne ne peut avoir qu'un seul compte. " +
  "Contactez support@fixili.tn.";
