import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { resetFaceDescriptor } from "@/lib/db/face";
import { findUserById } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  const session = await getSession();

  // Only admins can reset another user's face
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const targetUserId = body?.userId as string | undefined;

  if (!targetUserId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Clear descriptor + all known devices
  await resetFaceDescriptor(targetUserId);

  return NextResponse.json({
    ok: true,
    message: `Face and all devices cleared for ${user.fullName}. They must re-verify on next login.`,
  });
}