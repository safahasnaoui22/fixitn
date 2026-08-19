import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import {
  saveFaceDescriptor,
  saveKnownDevice,
  getAllFaceDescriptors,
} from "@/lib/db/face";

const UNIQUENESS_THRESHOLD = 0.45; // Strict — lower = harder to spoof

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

  // ── Check face uniqueness across ALL existing accounts ─────────────
  const existingDescriptors = await getAllFaceDescriptors(session.userId);

  for (const existing of existingDescriptors) {
    const distance = euclidean(descriptor, existing.descriptor);
    if (distance < UNIQUENESS_THRESHOLD) {
      return NextResponse.json(
        {
          error:
            "This face is already registered to another account. " +
            "Each person can only have one FixiTN account. " +
            "If you believe this is a mistake, contact support@fixitn.tn",
          code: "FACE_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }
  }

  // ── Save descriptor ────────────────────────────────────────────────
  await saveFaceDescriptor(session.userId, descriptor);

  // ── Register this device ───────────────────────────────────────────
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await saveKnownDevice(session.userId, deviceToken, userAgent);

  // ── Re-issue full session JWT ──────────────────────────────────────
  await createSession({
    userId: session.userId,
    role: session.role,
    fullName: session.fullName,
    sessionVersion: session.sessionVersion ?? 0,
    faceSetup: true,
    deviceVerified: true,
    accountApproved: session.accountApproved,
  });

  return NextResponse.json({ ok: true, deviceToken });
}