import { NextRequest, NextResponse } from "next/server";
import {
  getPendingSession,
  destroyPendingSession,
  createSession,
} from "@/lib/auth";
import { getFaceDescriptor, saveKnownDevice } from "@/lib/db/face";
import { findUserById } from "@/lib/db/users";

const THRESHOLD = 0.5;

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

export async function POST(req: NextRequest) {
  const pending = await getPendingSession();
  if (!pending) {
    return NextResponse.json(
      { error: "No pending session — please log in first" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.descriptor) || body.descriptor.length !== 128) {
    return NextResponse.json({ error: "Invalid descriptor" }, { status: 400 });
  }

  const incomingDescriptor: number[] = body.descriptor;
  const deviceToken: string = body.deviceToken ?? crypto.randomUUID();

  // Load the stored descriptor for this pending user
  const storedDescriptor = await getFaceDescriptor(pending.pendingUserId);
  if (!storedDescriptor) {
    return NextResponse.json(
      {
        error:
          "No face registered for this account. " +
          "Contact support@fixili.tn to reset your account.",
      },
      { status: 404 }
    );
  }

  // Compare
  const distance = euclidean(incomingDescriptor, storedDescriptor);
  console.log(
    `[face/verify] userId=${pending.pendingUserId} distance=${distance.toFixed(4)}`
  );

  if (distance > THRESHOLD) {
    return NextResponse.json(
      {
        error: "Face does not match. Try better lighting or contact support.",
        distance: Number(distance.toFixed(4)),
        code: "FACE_MISMATCH",
      },
      { status: 403 }
    );
  }

  // Face matched — load user
  const user = await findUserById(pending.pendingUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Register the new device
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await saveKnownDevice(pending.pendingUserId, deviceToken, userAgent);

  // Destroy the short-lived pending cookie
  await destroyPendingSession();

  // Issue full session
  await createSession({
    userId: user.id,
    role: user.role as import("@/lib/constants").Role,
    fullName: user.fullName,
    sessionVersion: pending.sessionVersion,
    faceSetup: true,
    deviceVerified: true,
    accountApproved:
      user.role === "TECHNICIAN" ? undefined : true,
  });

  return NextResponse.json({
    ok: true,
    deviceToken,
    distance: Number(distance.toFixed(4)),
  });
}