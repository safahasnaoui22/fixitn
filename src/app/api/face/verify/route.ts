import { NextRequest, NextResponse } from "next/server";
import { getPendingSession, destroyPendingSession, createSession } from "@/lib/auth";
import { getFaceDescriptor, saveKnownDevice } from "@/lib/db/face";
import { findUserById } from "@/lib/db/users";

const THRESHOLD = 0.5;

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

export async function POST(req: NextRequest) {
  // Only valid for users mid-login (has pending session)
  const pending = await getPendingSession();
  if (!pending) {
    return NextResponse.json(
      { error: "No pending session — please log in first" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.descriptor) || body.descriptor.length !== 128) {
    return NextResponse.json(
      { error: "Invalid descriptor" },
      { status: 400 }
    );
  }

  const incomingDescriptor: number[] = body.descriptor;
  const deviceToken: string = body.deviceToken ?? crypto.randomUUID();

  // Load stored descriptor for this user
  const storedDescriptor = await getFaceDescriptor(pending.pendingUserId);
  if (!storedDescriptor) {
    return NextResponse.json(
      { error: "No face registered for this account. Contact support." },
      { status: 404 }
    );
  }

  // Compare faces
  const distance = euclidean(incomingDescriptor, storedDescriptor);
  if (distance > THRESHOLD) {
    return NextResponse.json(
      {
        error: "Face does not match",
        distance: Number(distance.toFixed(4)),
        tip: "Try better lighting or contact support if this is your account.",
      },
      { status: 403 }
    );
  }

  // Face matched — load user + issue full session
  const user = await findUserById(pending.pendingUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Register this device
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await saveKnownDevice(pending.pendingUserId, deviceToken, userAgent);

  // Destroy the pending (short-lived) cookie
  await destroyPendingSession();

  // Issue full session
  await createSession({
    userId: user.id,
    role: user.role as import("@/lib/constants").Role,
    fullName: user.fullName,
    sessionVersion: pending.sessionVersion,
    faceSetup: true,
    deviceVerified: true,
  });

  return NextResponse.json({
    ok: true,
    deviceToken,
    distance: Number(distance.toFixed(4)),
  });
}