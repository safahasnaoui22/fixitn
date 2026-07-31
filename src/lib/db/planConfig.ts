import { prisma } from "./client";

export interface PlanConfigData {
  id: string;
  minTotalReviews: number;   // must have at least this many before any promotion
  minFiveStarCount: number;  // route 1: X five-star reviews → Senior
  minAverageRating: number;  // route 2: average rating ≥ this AND…
  minFourStarCount: number;  //          …at least this many ≥4-star reviews → Senior
  updatedAt: string;
}

const DEFAULTS = {
  minTotalReviews: 15,
  minFiveStarCount: 10,
  minAverageRating: 4.5,
  minFourStarCount: 8,
};

export async function getPlanConfig(): Promise<PlanConfigData> {
  let cfg = await prisma.planConfig.findFirst();
  if (!cfg) {
    cfg = await prisma.planConfig.create({ data: DEFAULTS });
  }
  return {
    id: cfg.id,
    minTotalReviews: cfg.minTotalReviews,
    minFiveStarCount: cfg.minFiveStarCount,
    minAverageRating: Number(cfg.minAverageRating),
    minFourStarCount: cfg.minFourStarCount,
    updatedAt: cfg.updatedAt.toISOString(),
  };
}

export async function updatePlanConfig(input: {
  minTotalReviews: number;
  minFiveStarCount: number;
  minAverageRating: number;
  minFourStarCount: number;
}): Promise<void> {
  const existing = await prisma.planConfig.findFirst();
  if (existing) {
    await prisma.planConfig.update({ where: { id: existing.id }, data: input });
  } else {
    await prisma.planConfig.create({ data: input });
  }
}

/**
 * Called automatically after every new review.
 * Checks if the technician now qualifies for Senior Pro and promotes them.
 */
export async function checkSeniorEligibility(technicianId: string): Promise<void> {
  const tech = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { isSenior: true, userId: true },
  });
  if (!tech || tech.isSenior) return; // already Senior, nothing to do

  const [config, aggregate, fiveStarCount, fourPlusCount] = await Promise.all([
    getPlanConfig(),
    prisma.review.aggregate({
      where: { technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.count({ where: { technicianId, rating: 5 } }),
    prisma.review.count({ where: { technicianId, rating: { gte: 4 } } }),
  ]);

  const totalReviews = aggregate._count.rating;
  const avgRating = aggregate._avg.rating ?? 0;

  // Must have minimum total reviews before either route is considered
  if (totalReviews < config.minTotalReviews) return;

  // Route 1 — enough 5-star reviews
  const route1 = fiveStarCount >= config.minFiveStarCount;
  // Route 2 — high average + enough 4+ reviews
  const route2 =
    avgRating >= config.minAverageRating &&
    fourPlusCount >= config.minFourStarCount;

  if (!route1 && !route2) return;

  // Find Senior Pro plan
  const seniorPlan = await prisma.plan.findFirst({ where: { key: "SENIOR_PRO" } });
  if (!seniorPlan) return;

  // Promote
  await prisma.technician.update({
    where: { id: technicianId },
    data: { isSenior: true, seniorSince: new Date(), planId: seniorPlan.id },
  });

  const { createNotification } = await import("./notifications");
  await createNotification({
    userId: tech.userId,
    type: "STATUS_UPDATE",
    title: "🎉 You are now a Senior Pro!",
    body: "Congratulations — you've earned the Senior Pro badge. Clients will see it on your profile.",
    requestId: null,
  });
}

/**
 * Admin: manually promote or demote a technician.
 */
export async function manuallySetSenior(
  technicianId: string,
  isSenior: boolean
): Promise<void> {
  const tech = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { userId: true },
  });
  if (!tech) return;

  const plan = await prisma.plan.findFirst({
    where: { key: isSenior ? "SENIOR_PRO" : "BEGINNER" },
  });

  await prisma.technician.update({
    where: { id: technicianId },
    data: {
      isSenior,
      seniorSince: isSenior ? new Date() : null,
      planId: plan?.id ?? null,
    },
  });

  const { createNotification } = await import("./notifications");
  await createNotification({
    userId: tech.userId,
    type: "STATUS_UPDATE",
    title: isSenior
      ? "🎉 You've been promoted to Senior Pro!"
      : "Your plan has been updated to Beginner",
    body: isSenior
      ? "An admin has granted you Senior Pro status."
      : "Your account plan has been adjusted by an admin.",
    requestId: null,
  });
}