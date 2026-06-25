"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  acceptRequest,
  declineRequest,
  cancelRequest,
  advanceStatus,
  markCompleted,
  confirmSolved,
  getRequestById,
} from "@/lib/db/requests";

export async function acceptAction(requestId: string): Promise<void> {
  await requireUser();
  await acceptRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function declineAction(requestId: string): Promise<void> {
  await requireUser();
  await declineRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function cancelAction(requestId: string): Promise<void> {
  await requireUser();
  await cancelRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function advanceStatusAction(requestId: string): Promise<void> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  if (!req || req.technicianUserId !== session.userId) return;

  if (req.status === "ACCEPTED") await advanceStatus(requestId, "ON_THE_WAY");
  else if (req.status === "ON_THE_WAY") await advanceStatus(requestId, "ARRIVED");
  else if (req.status === "ARRIVED") await advanceStatus(requestId, "IN_PROGRESS");
  else if (req.status === "IN_PROGRESS") await markCompleted(requestId);

  redirect(`/requests/${requestId}`);
}

export async function confirmSolvedAction(
  requestId: string,
  solved: boolean
): Promise<void> {
  await requireUser();
  await confirmSolved(requestId, solved);
  redirect(`/requests/${requestId}`);
}