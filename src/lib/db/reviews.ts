import { prisma } from "./client";
import type { ReviewWithAuthor } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(r: any): ReviewWithAuthor {
  return {
    id: r.id,
    requestId: r.requestId,
    technicianId: r.technicianId,
    authorId: r.authorId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    authorFullName: r.author.fullName,
    authorAvatarUrl: r.author.avatarUrl,
  };
}

export async function createReview(input: {
  requestId: string;
  technicianId: string;
  authorId: string;
  rating: number;
  comment?: string | null;
}): Promise<void> {
  await prisma.review.create({
    data: {
      requestId: input.requestId,
      technicianId: input.technicianId,
      authorId: input.authorId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
  });
}

export async function getReviewByRequestId(requestId: string): Promise<{ id: string } | null> {
  const r = await prisma.review.findUnique({
    where: { requestId },
    select: { id: true },
  });
  return r ?? null;
}

export async function listReviewsForTechnician(technicianId: string): Promise<ReviewWithAuthor[]> {
  const reviews = await prisma.review.findMany({
    where: { technicianId },
    include: { author: { select: { fullName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return reviews.map(mapReview);
}

export async function getRatingBreakdown(
  technicianId: string
): Promise<{ counts: Record<1 | 2 | 3 | 4 | 5, number>; avg: number | null; total: number }> {
  const [grouped, aggregate] = await Promise.all([
    prisma.review.groupBy({
      by: ["rating"],
      where: { technicianId },
      _count: { rating: true },
    }),
    prisma.review.aggregate({
      where: { technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of grouped) {
    counts[g.rating as 1 | 2 | 3 | 4 | 5] = g._count.rating;
  }

  return {
    counts,
    avg: aggregate._avg.rating,
    total: aggregate._count.rating,
  };
}