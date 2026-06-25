"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRequestById } from "@/lib/db/requests";
import { createReview, getReviewByRequestId } from "@/lib/db/reviews";

export async function submitReviewAction(
  requestId: string,
  formData: FormData
): Promise<void> {
  const session = await requireUser();

  const req = await getRequestById(requestId);
  if (!req || req.clientId !== session.userId || req.status !== "COMPLETED") {
    redirect(`/requests/${requestId}`);
  }

  const existing = await getReviewByRequestId(requestId);
  if (existing) redirect(`/requests/${requestId}`);

  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (rating < 1 || rating > 5) {
    redirect(`/requests/${requestId}/rate?error=Pick a star rating before submitting.`);
  }

  await createReview({
    requestId,
    technicianId: req.technicianId,
    authorId: session.userId,
    rating,
    comment,
  });

  redirect(`/requests/${requestId}`);
}