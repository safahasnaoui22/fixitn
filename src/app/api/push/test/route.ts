import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPushToUser } from "@/lib/webpush";

/**
 * Open /api/push/test while logged in: sends a test push to ALL your devices
 * and tells you why nothing arrives if it fails.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const r = await sendPushToUser(session.userId, {
    title: "🔔 Fixili test",
    body: "Push notifications work, even with the app closed.",
    url: "/notifications",
    tag: "fixili-test",
  });

  let hint = "OK — check your phone/computer.";
  if (!r.configured) hint = "VAPID keys are missing on the server (.env / Vercel variables).";
  else if (r.subscriptions === 0)
    hint = "No device is subscribed. Open the app, tap 'Activer' on the banner and allow notifications, then retry.";
  else if (r.sent === 0) hint = "Sending failed; see the server logs ([push] send failed).";

  return NextResponse.json({ ...r, hint });
}
