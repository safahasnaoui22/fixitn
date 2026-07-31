import { prisma } from "./client";

// --- Face descriptor ---------------------------------------------------

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
  // Also wipe all known devices — they must re-verify next login
  await prisma.knownDevice.deleteMany({ where: { userId } });
}

// --- Known devices -----------------------------------------------------

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