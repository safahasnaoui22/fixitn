import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Gives a technician a short-lived signature so the browser can upload a
// photo/video straight to Cloudinary (avoids the serverless body-size limit).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { kind } = (await req.json().catch(() => ({}))) as { kind?: string };
  const isVideo = kind === "video";
  const folder = `fixitn/portfolio/${isVideo ? "videos" : "images"}`;
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 500 });
  }
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
  return NextResponse.json({
    signature, timestamp, folder, apiKey, cloudName,
    resourceType: isVideo ? "video" : "image",
  });
}
