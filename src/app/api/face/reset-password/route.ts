import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getFaceDescriptor } from "@/lib/db/face";
import { hashPassword } from "@/lib/auth";

const THRESHOLD = 0.5;

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone: string       = body?.phone ?? "";
  const descriptor: number[] = body?.descriptor ?? [];
  const newPassword: string = body?.newPassword ?? "";

  if (!phone || descriptor.length !== 128 || newPassword.length < 6) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Compte introuvable." },
      { status: 404 }
    );
  }

  // Re-verify face one final time before changing password
  const stored = await getFaceDescriptor(user.id);
  if (!stored) {
    return NextResponse.json(
      { error: "Aucun visage enregistré." },
      { status: 403 }
    );
  }

  const distance = euclidean(descriptor, stored);
  if (distance > THRESHOLD) {
    return NextResponse.json(
      { error: "Vérification du visage échouée." },
      { status: 403 }
    );
  }

  // Update password + bump sessionVersion → logs out ALL devices
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });

  // Also clear all known devices → user must re-verify face on next login
  await prisma.knownDevice.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true });
}