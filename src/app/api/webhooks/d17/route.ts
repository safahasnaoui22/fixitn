import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // verify signature from D17
  if (body.status === "SUCCESS") {
    await prisma.payment.updateMany({
      where: { requestId: body.order_id },
      data: { status: "PAID", method: "D17" },
    });
  }
  return NextResponse.json({ ok: true });
}