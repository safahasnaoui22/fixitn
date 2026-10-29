import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

/**
 * Tiny "am I still the active device?" check, polled by <SessionGuard />.
 * If the user logged in (and passed the face check) on another device, the
 * sessionVersion in the DB moved on → this device's cookie is removed and the
 * client is sent to /login.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ valid: false, hadSession: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { sessionVersion: true, lastSeenAt: true },
    });

    if (!user || user.sessionVersion !== session.sessionVersion) {
      await destroySession();
      return NextResponse.json({ valid: false, hadSession: true });
    }
    // Presence ("En ligne"): refresh at most once a minute
    const last = user.lastSeenAt?.getTime() ?? 0;
    if (Date.now() - last > 60_000) {
      await prisma.user
        .update({ where: { id: session.userId }, data: { lastSeenAt: new Date() } })
        .catch(() => {});
    }
  } catch {
    // database hiccup: do not log anybody out because of it
    return NextResponse.json({ valid: true, hadSession: true });
  }

  return NextResponse.json({ valid: true, hadSession: true });
}
