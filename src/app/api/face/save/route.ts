import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { saveFaceDescriptor } from "@/lib/db/face";
import { saveKnownDevice } from "@/lib/db/face";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.descriptor) || body.descriptor.length !== 128) {
    return NextResponse.json(
      { error: "Invalid descriptor — expected 128 numbers" },
      { status: 400 }
    );
  }

  const descriptor: number[] = body.descriptor;
  const deviceToken: string = body.deviceToken ?? crypto.randomUUID();

  // Save descriptor to User row
  await saveFaceDescriptor(session.userId, descriptor);

  // Register this device as known
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await saveKnownDevice(session.userId, deviceToken, userAgent);

  // Re-issue full session JWT — now with faceSetup:true + deviceVerified:true
  await createSession({
    userId: session.userId,
    role: session.role,
    fullName: session.fullName,
    sessionVersion: session.sessionVersion ?? 0,
    faceSetup: true,
    deviceVerified: true,
  });

  return NextResponse.json({ ok: true, deviceToken });
}