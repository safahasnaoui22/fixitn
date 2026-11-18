import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { resetFaceDescriptor } from "@/lib/db/face";
import { findUserById } from "@/lib/db/users";
import { getT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  const session = await getSession();

  // Only admins can reset another user's face
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: t("auth.api.forbidden") }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const targetUserId = body?.userId as string | undefined;

  if (!targetUserId) {
    return NextResponse.json({ error: t("auth.api.userIdRequired") }, { status: 400 });
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    return NextResponse.json({ error: t("auth.api.userNotFound") }, { status: 404 });
  }

  // Clear descriptor + all known devices
  await resetFaceDescriptor(targetUserId);

  return NextResponse.json({
    ok: true,
    message: t("auth.api.resetDone", { name: user.fullName }),
  });
}