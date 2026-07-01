import { prisma } from "./client";
import { parseStringArray, toStringArray } from "../utils";
import type { Category, Technician, TechnicianWithUser } from "../types";

function mapCategory(c: {
  id: string; slug: string; name: string; icon: string; color: string;
  description: string | null; howItWorks: string | null; videoUrl: string | null;
  ratingAvg: number | null; ratingCount: number | null; sortOrder: number;
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
    planId: t.planId,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    fullName: t.user.fullName,
    avatarUrl: t.user.avatarUrl,
    phone: t.user.phone,
    ratingAvg,
    ratingCount,
  };
}

function computeRating(reviews: { rating: number }[]): { avg: number | null; count: number } {
  if (reviews.length === 0) return { avg: null, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg, count: reviews.length };
}

const TECH_INCLUDE = {
  user: { select: { fullName: true, avatarUrl: true, phone: true } },
  reviews: { select: { rating: true } },
} as const;

export async function listCategories(): Promise<Category[]> {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return cats.map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c ? mapCategory(c) : null;
}

export async function listTechniciansByCategorySlug(slug: string): Promise<TechnicianWithUser[]> {
  const technicians = await prisma.technician.findMany({
    where: { categories: { some: { slug } } },
    include: TECH_INCLUDE,
  });
  return technicians
    .map((t) => {
      const { avg, count } = computeRating(t.reviews);
      return { t, avg, count };
    })
    .sort((a, b) => {
      if (a.t.verified !== b.t.verified) return a.t.verified ? -1 : 1;
      return (b.avg ?? 0) - (a.avg ?? 0);
    })
    .map(({ t, avg, count }) => mapTechWithUser(t, avg, count));
}

export async function getTechnicianById(id: string): Promise<TechnicianWithUser | null> {
  const t = await prisma.technician.findUnique({ where: { id }, include: TECH_INCLUDE });
  if (!t) return null;
  const { avg, count } = computeRating(t.reviews);
  return mapTechWithUser(t, avg, count);
}

export async function getTechnicianByUserId(userId: string): Promise<TechnicianWithUser | null> {
  const t = await prisma.technician.findUnique({ where: { userId }, include: TECH_INCLUDE });
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
}): Promise<Technician> {
  const t = await prisma.technician.create({
    data: {
      userId: input.userId,
      title: input.title,
      bio: input.bio ?? null,
      yearsExperience: input.yearsExperience ?? 0,
      startingPrice: input.startingPrice ?? 0,
      galleryImages: toStringArray([]),
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
    planId: t.planId,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function updateTechnicianProfile(
  technicianId: string,
  input: { title: string; bio: string | null; yearsExperience: number; startingPrice: number }
): Promise<void> {
  await prisma.technician.update({ where: { id: technicianId }, data: input });
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