"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServiceRequest } from "@/lib/db/requests";

function fail(technicianId: string, message: string): never {
  redirect(`/technician/${technicianId}/request?error=${encodeURIComponent(message)}`);
}

export async function requestServiceAction(formData: FormData): Promise<void> {
  const session = await requireUser();

  const technicianId = String(formData.get("technicianId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : null;
  const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : null;

  if (!technicianId || !categoryId || !fullName || !phone || !address || !description) {
    fail(technicianId || "unknown", "Please fill in all the required fields.");
  }

  // Photos are stored as base64 data-URLs directly in SQLite — no cloud
  // storage in this sandbox setup. Capped at 4 to keep row size reasonable.
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photos: string[] = [];
  for (const file of files.slice(0, 4)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push(`data:${file.type};base64,${buffer.toString("base64")}`);
  }

  const requestId = await createServiceRequest({
    clientId: session.userId,
    technicianId,
    categoryId,
    fullName,
    phone,
    address,
    latitude,
    longitude,
    description,
    photos,
  });

  redirect(`/requests/${requestId}`);
}