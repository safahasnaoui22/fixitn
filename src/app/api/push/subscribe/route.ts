import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePushSubscription } from "@/lib/db/push";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription(session.userId, { endpoint, keys });
  return NextResponse.json({ ok: true });
}