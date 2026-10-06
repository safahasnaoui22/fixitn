import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// Called by the /t/pending page every few seconds.
// When the admin has approved the technician (DB status ACTIVE) we re-issue
// the session with accountApproved:true so the middleware lets them into /t/*.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, tech] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { sessionVersion: true },
    }),
    prisma.technician.findUnique({
      where: { userId: session.userId },
      select: { accountStatus: true },
    }),
  ]);

  // Logged in elsewhere / deleted → session no longer valid
  if (!user || user.sessionVersion !== session.sessionVersion) {
    return NextResponse.json({ error: "Session ended" }, { status: 401 });
  }

  const status = tech?.accountStatus ?? "PENDING";

  if (status === "ACTIVE") {
    await createSession({
      userId: session.userId,
      role: session.role,
      fullName: session.fullName,
      sessionVersion: session.sessionVersion,
      faceSetup: session.faceSetup,
      deviceVerified: session.deviceVerified,
      accountApproved: true,
    });
    return NextResponse.json({ approved: true, status });
  }

  return NextResponse.json({ approved: false, status });
}