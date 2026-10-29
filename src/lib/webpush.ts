import webpush from "web-push";
import { deletePushSubscription } from "./db/push";

let configured = false;

/** Configure VAPID once, only when called (never crash at import time). */
function configure(): boolean {
  if (configured) return true;
  let subject = process.env.VAPID_SUBJECT?.trim();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!subject || !pub || !priv) {
    console.error(
      "[push] VAPID keys missing. Set VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
    return false;
  }
  // The subject must be a mailto: or https: URL
  if (!/^(mailto:|https?:\/\/)/i.test(subject)) subject = `mailto:${subject}`;
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
    return true;
  } catch (e) {
    console.error("[push] Invalid VAPID configuration:", e);
    return false;
  }
}

export interface PushResult {
  configured: boolean;
  subscriptions: number;
  sent: number;
  failed: number;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; url?: string; tag?: string }
): Promise<PushResult> {
  const result: PushResult = { configured: false, subscriptions: 0, sent: 0, failed: 0 };
  if (!configure()) return result;
  result.configured = true;

  const { getUserPushSubscriptions } = await import("./db/push");
  const subscriptions = await getUserPushSubscriptions(userId);
  result.subscriptions = subscriptions.length;
  if (subscriptions.length === 0) return result;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          {
            // "high" wakes a sleeping phone; TTL keeps the message 24h if it is offline
            urgency: "high",
            TTL: 60 * 60 * 24,
          }
        );
        result.sent += 1;
      } catch (err: unknown) {
        result.failed += 1;
        const status = (err as { statusCode?: number }).statusCode;
        // 404 / 410 = subscription expired or revoked → clean it
        if (status === 404 || status === 410) {
          await deletePushSubscription(sub.endpoint);
        } else {
          console.error("[push] send failed:", status, (err as Error).message);
        }
      }
    })
  );
  return result;
}
