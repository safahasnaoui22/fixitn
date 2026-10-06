import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import {
  saveFaceDescriptor,
  saveKnownDevice,
  getAllFaceDescriptors,
} from "@/lib/db/face";

import { isTechnicianApproved } from "@/lib/db/technicianApproval";

const UNIQUENESS_THRESHOLD = 0.45;

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

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

  // ── FACE UNIQUENESS CHECK ──────────────────────────────────────────
  // Compare incoming face against every stored descriptor.
  // If any match (distance < threshold) → this face already has an account.
  // DEV ONLY: lets one person (e.g. the developer) register the same face on
  // several test accounts. Needs BOTH a non-production build AND the env flag,
  // so it can never switch on by accident on Vercel.
  const skipUniqueness =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DUPLICATE_FACES === "true";

  const existing = skipUniqueness
    ? []
    : await getAllFaceDescriptors(session.userId);

  for (const stored of existing) {
    const distance = euclidean(descriptor, stored.descriptor);
    if (distance < UNIQUENESS_THRESHOLD) {
      console.log(
        `[face/save] Face already exists. userId=${session.userId} matched=${stored.userId} distance=${distance.toFixed(4)}`
      );
      return NextResponse.json(
        {
          error:
            "This face is already linked to another Fixili account. " +
            "Each person can only have one account. " +
            "Contact support@fixili.tn if you believe this is an error.",
          code: "FACE_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }
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