import { prisma } from "./client";

export async function savePushSubscription(
  userId: string,
  data: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: { userId, p256dh: data.keys.p256dh, auth: data.keys.auth },
    create: { userId, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth },
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function getUserPushSubscriptions(userId: string) {
  return prisma.pushSubscription.findMany({ where: { userId } });
}