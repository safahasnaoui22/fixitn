import { NextRequest, NextResponse } from "next/server";
import { deletePushSubscription } from "@/lib/db/push";

export async function POST(req: NextRequest) {
  const { endpoint } = await req.json();
  if (endpoint) await deletePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}