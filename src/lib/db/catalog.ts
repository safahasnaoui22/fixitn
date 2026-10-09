import { prisma } from "./client";
import { parseStringArray, toStringArray } from "../utils";
import type { Category, Technician, TechnicianWithUser } from "../types";
import type { AccountStatus } from "../constants";

// Haversine formula — distance between two GPS points in km
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

function mapCategory(c: {
  id: string; slug: string; name: string; icon: string; color: string;
  description: string | null; howItWorks: string | null; videoUrl: string | null;
  imageUrl: string | null;
  ratingAvg: number | null; ratingCount: number | null; sortOrder: number;
  isActive: boolean; visitPrice: number;
}): Category {
  return { ...c, howItWorks: parseStringArray(c.howItWorks) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTechWithUser(t: any, ratingAvg: number | null, ratingCount: number): TechnicianWithUser {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    bio: t.bio,
    yearsExperience: t.yearsExperience,
    startingPrice: t.startingPrice,
    latitude: t.latitude,
    longitude: t.longitude,
    verified: t.verified,
    galleryImages: parseStringArray(t.galleryImages),
    cinUrl: t.cinUrl ?? null,
    diplomeUrl: t.diplomeUrl ?? null,
    isSenior: t.isSenior ?? false,
    seniorSince: t.seniorSince instanceof Date
      ? t.seniorSince.toISOString()
      : (t.seniorSince ?? null),
    accountStatus: (t.accountStatus ?? "PENDING") as AccountStatus,
    departureLatitude: t.departureLatitude ?? null,
    departureLongitude: t.departureLongitude ?? null,
    departureAt: t.departureAt instanceof Date
      ? t.departureAt.toISOString()
      : (t.departureAt ?? null),
    distanceTraveled: t.distanceTraveled ?? null,
    transportFee: t.transportFee ?? null,
    planId: t.planId ?? null,
    createdAt: t.createdAt instanceof Date
      ? t.createdAt.toISOString()
      : t.createdAt,
    fullName: t.user.fullName,
    avatarUrl: t.user.avatarUrl,
    phone: t.user.phone,
    ratingAvg,
    ratingCount,
  };
}

function computeRating(reviews: { rating: number }[]): { avg: number | null; count: number } {
  if (reviews.length === 0) return { avg: null, count: 0 };
  return {
    avg: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
    count: reviews.length,
  };
}

const TECH_INCLUDE = {
  user: { select: { fullName: true, avatarUrl: true, phone: true } },
  reviews: { select: { rating: true } },
  plan: { select: { key: true, radiusKm: true } },
} as const;

// ── Categories ─────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return cats.map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c ? mapCategory(c) : null;
}

// ── Technicians ────────────────────────────────────────────────────────

/**
 * List technicians for a category.
 * - Only returns accountStatus=ACTIVE technicians.
 * - If client GPS is provided, filters by each technician's plan radius.
 * - Sorts: Senior Pro first → verified → highest rating.
 */
export async function listTechniciansByCategorySlug(
  slug: string,
  clientLat?: number | null,
  clientLng?: number | null
): Promise<TechnicianWithUser[]> {
  const technicians = await prisma.technician.findMany({
    where: {
      categories: { some: { slug } },
      accountStatus: "ACTIVE",
    },
    include: TECH_INCLUDE,
  });

  return technicians
    .map((t) => {
      const { avg, count } = computeRating(t.reviews);
      const distanceKm =
        clientLat != null && clientLng != null
          ? haversineKm(clientLat, clientLng, t.latitude, t.longitude)
          : null;
      return { t, avg, count, distanceKm };
    })
    // Filter by plan radius when client location is known
    .filter(({ t, distanceKm }) => {
      if (distanceKm == null) return true;
      const radiusKm = t.plan?.radiusKm ?? 30;
      return distanceKm <= radiusKm;
    })
    .sort((a, b) => {
      if (a.t.isSenior !== b.t.isSenior) return a.t.isSenior ? -1 : 1;
      if (a.t.verified !== b.t.verified) return a.t.verified ? -1 : 1;
      return (b.avg ?? 0) - (a.avg ?? 0);
    })
    .map(({ t, avg, count }) => mapTechWithUser(t, avg, count));
}

export async function getTechnicianById(id: string): Promise<TechnicianWithUser | null> {
  const t = await prisma.technician.findUnique({
    where: { id },
    include: TECH_INCLUDE,
  });
  if (!t) return null;
  const { avg, count } = computeRating(t.reviews);
  return mapTechWithUser(t, avg, count);
}

export async function getTechnicianByUserId(userId: string): Promise<TechnicianWithUser | null> {
  const t = await prisma.technician.findUnique({
    where: { userId },
    include: TECH_INCLUDE,
  });
  if (!t) return null;
  const { avg, count } = computeRating(t.reviews);
  return mapTechWithUser(t, avg, count);
}

export async function listCategoriesForTechnician(technicianId: string): Promise<Category[]> {
  const t = await prisma.technician.findUnique({
    where: { id: technicianId },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
  return (t?.categories ?? []).map(mapCategory);
}

export async function createTechnicianProfile(input: {
  userId: string;
  title: string;
  bio?: string | null;
  yearsExperience?: number;
  startingPrice?: number;
  categoryIds: string[];
  planId: string;
  cinUrl?: string | null;
  diplomeUrl?: string | null;
}): Promise<Technician> {
  const t = await prisma.technician.create({
    data: {
      userId: input.userId,
      title: input.title,
      bio: input.bio ?? null,
      yearsExperience: input.yearsExperience ?? 0,
      startingPrice: input.startingPrice ?? 0,
      galleryImages: toStringArray([]),
      cinUrl: input.cinUrl ?? null,
      diplomeUrl: input.diplomeUrl ?? null,
      isSenior: false,
      accountStatus: "PENDING", // all new registrations start as PENDING
      planId: input.planId,
      categories: { connect: input.categoryIds.map((id) => ({ id })) },
    },
  });
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    bio: t.bio,
    yearsExperience: t.yearsExperience,
    startingPrice: t.startingPrice,
    latitude: t.latitude,
    longitude: t.longitude,
    verified: t.verified,
    galleryImages: parseStringArray(t.galleryImages),
    cinUrl: t.cinUrl,
    diplomeUrl: t.diplomeUrl,
    isSenior: t.isSenior,
    seniorSince: t.seniorSince?.toISOString() ?? null,
    accountStatus: t.accountStatus as AccountStatus,
    departureLatitude: t.departureLatitude,
    departureLongitude: t.departureLongitude,
    departureAt: t.departureAt?.toISOString() ?? null,
    distanceTraveled: t.distanceTraveled,
    transportFee: t.transportFee,
    planId: t.planId,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function updateTechnicianProfile(
  technicianId: string,
  input: {
    title: string;
    bio: string | null;
    yearsExperience: number;
    startingPrice: number;
  }
): Promise<void> {
  await prisma.technician.update({
    where: { id: technicianId },
    data: input,
  });
}

export async function updateTechnicianDocuments(
  technicianId: string,
  input: { cinUrl?: string; diplomeUrl?: string }
): Promise<void> {
  await prisma.technician.update({
    where: { id: technicianId },
    data: {
      ...(input.cinUrl ? { cinUrl: input.cinUrl } : {}),
      ...(input.diplomeUrl ? { diplomeUrl: input.diplomeUrl } : {}),
    },
  });
}

export async function getTechnicianStats(
  technicianId: string
): Promise<{ jobsCompleted: number; satisfactionPct: number | null }> {
  const [jobsCompleted, solved, answered] = await Promise.all([
    prisma.serviceRequest.count({ where: { technicianId, status: "COMPLETED" } }),
    prisma.serviceRequest.count({ where: { technicianId, status: "COMPLETED", clientConfirmedSolved: true } }),
    prisma.serviceRequest.count({ where: { technicianId, status: "COMPLETED", clientConfirmedSolved: { not: null } } }),
  ]);
  return {
    jobsCompleted,
    satisfactionPct: answered > 0 ? Math.round((solved / answered) * 100) : null,
  };
}