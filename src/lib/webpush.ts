import webpush from "web-push";
import { deletePushSubscription } from "./db/push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; url?: string; tag?: string }
): Promise<void> {
  const { getUserPushSubscriptions } = await import("./db/push");
  const subscriptions = await getUserPushSubscriptions(userId);
  if (subscriptions.length === 0) return;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // 410 = subscription expired/revoked — delete it
        if ((err as { statusCode?: number }).statusCode === 410) {
          await deletePushSubscription(sub.endpoint);
        }
        // Never throw — push failures must not break the main flow
      }
    })
  );
}