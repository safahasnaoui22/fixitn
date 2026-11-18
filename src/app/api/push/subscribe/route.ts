import { getT } from "@/lib/i18n/server";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePushSubscription } from "@/lib/db/push";

export async function POST(req: NextRequest) {
  const t = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("sys.api.unauthorized") }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: t("sys.api.invalidSubscription") }, { status: 400 });
  }

  await savePushSubscription(session.userId, { endpoint, keys });
  return NextResponse.json({ ok: true });
}