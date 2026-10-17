import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import {
  saveFaceDescriptor,
  saveKnownDevice,
  findOtherAccountWithFace,
  FACE_SHARED_MESSAGE,
} from "@/lib/db/face";

import { isTechnicianApproved } from "@/lib/db/technicianApproval";

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

  // ── ONE FACE = ONE ACCOUNT ─────────────────────────────────────────
  // No bypass of any kind (the old ALLOW_DUPLICATE_FACES dev flag was removed).
  const owner = await findOtherAccountWithFace(descriptor, session.userId);
  if (owner) {
    console.log(
      `[face/save] Face already exists. userId=${session.userId} matched=${owner.userId} distance=${owner.distance.toFixed(4)}`
    );
    return NextResponse.json(
      { error: FACE_SHARED_MESSAGE, code: "FACE_ALREADY_EXISTS" },
      { status: 409 }
    );
  }

  // ── Save descriptor ────────────────────────────────────────────────
  await saveFaceDescriptor(session.userId, descriptor);

  // ── Register device as known ───────────────────────────────────────
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await saveKnownDevice(session.userId, deviceToken, userAgent);

  // ── Re-issue JWT with faceSetup:true + deviceVerified:true ─────────
  await createSession({
    userId: session.userId,
    role: session.role,
    fullName: session.fullName,
    sessionVersion: session.sessionVersion ?? 0,
    faceSetup: true,
    deviceVerified: true,
    accountApproved:
      session.role === "TECHNICIAN"
        ? await isTechnicianApproved(session.userId)
        : true,
  });

  return NextResponse.json({ ok: true, deviceToken });
}