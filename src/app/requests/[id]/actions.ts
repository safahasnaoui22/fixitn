"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import {
  acceptRequest,
  declineRequest,
  cancelRequest,
  advanceStatus,
  markCompleted,
  confirmSolved,
  getRequestById,
} from "@/lib/db/requests";
import { TRANSPORT_RATE_DT_PER_KM } from "@/lib/constants";

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function requireJobTechnician(requestId: string): Promise<boolean> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  return !!req && req.technicianUserId === session.userId;
}

async function requireJobClient(requestId: string): Promise<boolean> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  return !!req && req.clientId === session.userId;
}

export async function acceptAction(requestId: string): Promise<void> {
  if (!(await requireJobTechnician(requestId))) return;
  await acceptRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function declineAction(requestId: string): Promise<void> {
  if (!(await requireJobTechnician(requestId))) return;
  await declineRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function cancelAction(requestId: string): Promise<void> {
  if (!(await requireJobClient(requestId))) return;
  await cancelRequest(requestId);
  redirect(`/requests/${requestId}`);
}

export async function departAction(
  requestId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  if (!req || req.technicianUserId !== session.userId) return;
  if (req.status !== "ACCEPTED") return;

  await prisma.technician.update({
    where: { userId: session.userId },
    data: {
      departureLatitude: latitude,
      departureLongitude: longitude,
      departureAt: new Date(),
    },
  });

  await advanceStatus(requestId, "ON_THE_WAY");
  redirect(`/requests/${requestId}`);
}

export async function arrivedAction(requestId: string): Promise<void> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  if (!req || req.technicianUserId !== session.userId) return;
  if (req.status !== "ON_THE_WAY") return;

  const tech = await prisma.technician.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      departureLatitude: true,
      departureLongitude: true,
    },
  });

  if (
    tech?.departureLatitude != null &&
    tech?.departureLongitude != null &&
    req.latitude != null &&
    req.longitude != null
  ) {
    const distanceKm = haversineKm(
      tech.departureLatitude,
      tech.departureLongitude,
      req.latitude,
      req.longitude
    );
    const transportFee = Math.max(1, Math.round(distanceKm * TRANSPORT_RATE_DT_PER_KM));
    await prisma.technician.update({
      where: { id: tech.id },
      data: { distanceTraveled: distanceKm, transportFee },
    });
  }

  await advanceStatus(requestId, "ARRIVED");
  redirect(`/requests/${requestId}`);
}

export async function startWorkAction(requestId: string): Promise<void> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  if (!req || req.technicianUserId !== session.userId) return;
  if (req.status !== "ARRIVED") return;
  await advanceStatus(requestId, "IN_PROGRESS");
  redirect(`/requests/${requestId}`);
}

export async function completeAction(requestId: string): Promise<void> {
  const session = await requireUser();
  const req = await getRequestById(requestId);
  if (!req || req.technicianUserId !== session.userId) return;
  if (req.status !== "IN_PROGRESS") return;
  await markCompleted(requestId);
  redirect(`/requests/${requestId}`);
}

export async function confirmSolvedAction(
  requestId: string,
  solved: boolean
): Promise<void> {
  if (!(await requireJobClient(requestId))) return;
  await confirmSolved(requestId, solved);
  redirect(`/requests/${requestId}`);
}