import { prisma } from "./client";

export interface TechQuality {
  id: string;
  name: string;
  phone: string;
  title: string;
  isSenior: boolean;
  status: string;
  ratingAvg: number | null;
  reviewCount: number;
  jobsDone: number;
  totalJobs: number;
  cancelRate: number | null; // 0..1 (declined + cancelled)/total
  responseMin: number | null; // average minutes between request and acceptance
}

export async function listTechnicianQuality(): Promise<TechQuality[]> {
  const [techs, reviews, groups, accepted] = await Promise.all([
    prisma.technician.findMany({
      where: { accountStatus: { in: ["ACTIVE", "ARCHIVED"] } },
      select: {
        id: true,
        title: true,
        isSenior: true,
        accountStatus: true,
        user: { select: { fullName: true, phone: true } },
      },
    }),
    prisma.review.groupBy({
      by: ["technicianId"],
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.serviceRequest.groupBy({
      by: ["technicianId", "status"],
      _count: { _all: true },
    }),
    prisma.serviceRequest.findMany({
      where: { acceptedAt: { not: null } },
      select: { technicianId: true, pendingAt: true, acceptedAt: true },
    }),
  ]);

  const rev = new Map(reviews.map((r) => [r.technicianId, r]));
  const byTech = new Map<string, Record<string, number>>();
  for (const g of groups) {
    const m = byTech.get(g.technicianId) ?? {};
    m[g.status] = g._count._all;
    byTech.set(g.technicianId, m);
  }
  const resp = new Map<string, { sum: number; n: number }>();
  for (const a of accepted) {
    if (!a.acceptedAt) continue;
    const mins = (a.acceptedAt.getTime() - a.pendingAt.getTime()) / 60000;
    if (mins < 0) continue;
    const cur = resp.get(a.technicianId) ?? { sum: 0, n: 0 };
    cur.sum += mins;
    cur.n += 1;
    resp.set(a.technicianId, cur);
  }

  return techs.map((t) => {
    const s = byTech.get(t.id) ?? {};
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    const bad = (s.DECLINED ?? 0) + (s.CANCELLED ?? 0);
    const r = rev.get(t.id);
    const rp = resp.get(t.id);
    return {
      id: t.id,
      name: t.user.fullName,
      phone: t.user.phone,
      title: t.title,
      isSenior: t.isSenior,
      status: t.accountStatus,
      ratingAvg: r?._avg.rating ?? null,
      reviewCount: r?._count._all ?? 0,
      jobsDone: s.COMPLETED ?? 0,
      totalJobs: total,
      cancelRate: total > 0 ? bad / total : null,
      responseMin: rp && rp.n > 0 ? rp.sum / rp.n : null,
    };
  });
}
