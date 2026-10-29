import { prisma } from "./client";

/** A technician shown on a card of the client home page. */
export interface HomeTechnician {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string;
  yearsExperience: number;
  startingPrice: number;
  ratingAvg: number | null;
  ratingCount: number;
  online: boolean;
  categorySlugs: string[];
}

// A technician counts as "online" if the app was open in the last 3 minutes.
const ONLINE_WINDOW_MS = 3 * 60_000;

/**
 * Active technicians with the slugs of the categories they work in.
 * Best rated first (most stars, then most reviews), so the first card of every
 * category slider is the best technician of that category.
 */
export async function listHomeTechnicians(): Promise<HomeTechnician[]> {
  const rows = await prisma.technician.findMany({
    where: { accountStatus: "ACTIVE" },
    select: {
      id: true,
      title: true,
      yearsExperience: true,
      startingPrice: true,
      user: { select: { fullName: true, avatarUrl: true, lastSeenAt: true } },
      categories: { select: { slug: true } },
      reviews: { select: { rating: true } },
    },
  });

  const now = Date.now();
  return rows
    .map((t) => {
      const count = t.reviews.length;
      const avg = count ? t.reviews.reduce((s, r) => s + r.rating, 0) / count : null;
      const seen = t.user.lastSeenAt?.getTime() ?? 0;
      return {
        id: t.id,
        fullName: t.user.fullName,
        avatarUrl: t.user.avatarUrl,
        title: t.title,
        yearsExperience: t.yearsExperience,
        startingPrice: t.startingPrice,
        ratingAvg: avg,
        ratingCount: count,
        online: now - seen < ONLINE_WINDOW_MS,
        categorySlugs: t.categories.map((c) => c.slug),
      };
    })
    .sort(
      (a, b) =>
        (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1) ||
        b.ratingCount - a.ratingCount ||
        b.yearsExperience - a.yearsExperience
    );
}
