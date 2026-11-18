import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { sendPushToUser } from "@/lib/webpush";

/**
 * Open /api/push/test while logged in: sends a test push to ALL your devices
 * and tells you why nothing arrives if it fails.
 */
export async function GET() {
  const t = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("sys.api.loginFirst") }, { status: 401 });

  const r = await sendPushToUser(session.userId, {
    title: t("sys.api.push.testTitle"),
    body: t("sys.api.push.testBody"),
    url: "/notifications",
    tag: "fixili-test",
  });

  let hint = t("sys.api.push.ok");
  if (!r.configured) hint = t("sys.api.push.noVapid");
  else if (r.subscriptions === 0)
    hint = t("sys.api.push.noDevice");
  else if (r.sent === 0) hint = t("sys.api.push.sendFailed");

  return NextResponse.json({ ...r, hint });
}
