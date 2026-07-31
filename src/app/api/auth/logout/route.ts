import { NextResponse } from "next/server";
import { destroySession, destroyPendingSession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  await destroyPendingSession();
  return NextResponse.json({ ok: true });
}