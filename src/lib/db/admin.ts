import { prisma } from "./client";

// --- Dashboard stats ------------------------------------------------------

export async function getAdminStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalClients, totalTechnicians, jobsToday, revenueAgg, disputes] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.technician.count(),
    prisma.serviceRequest.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.aggregate({ where: { type: "PAYOUT" }, _sum: { platformFee: true } }),
    prisma.serviceRequest.count({ where: { status: "COMPLETED", clientConfirmedSolved: false } }),
  ]);

  return {
    totalClients,
    totalTechnicians,
    jobsToday,
    totalRevenue: revenueAgg._sum.platformFee ?? 0,
    disputes,
  };
}

// --- Users -----------------------------------------------------------------

export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  city: string | null;
  avatarUrl: string | null;
  createdAt: string;
  jobCount: number;
}

export async function listAdminUsers(role?: string): Promise<AdminUser[]> {
  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    include: {
      _count: { select: { requestsMade: true } },
      technician: { include: { _count: { select: { requestsReceived: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    email: u.email,
    role: u.role,
    city: u.city,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
    jobCount: u.role === "CLIENT" ? u._count.requestsMade : (u.technician?._count.requestsReceived ?? 0),
  }));
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const recentRequests = await prisma.serviceRequest.findMany({
    where: { clientId: userId },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    city: user.city,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      categoryName: r.category.name,
    })),
  };
}

export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}

// --- Technicians -------------------------------------------------------

export interface AdminTechnician {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  title: string;
  city: string | null;
  verified: boolean;
  planKey: string | null;
  startingPrice: number;
  ratingAvg: number | null;
  ratingCount: number;
  jobsCompleted: number;
  createdAt: string;
}

export async function listAdminTechnicians(): Promise<AdminTechnician[]> {
  const technicians = await prisma.technician.findMany({
    include: {
      user: { select: { fullName: true, phone: true, avatarUrl: true, city: true } },
      plan: { select: { key: true } },
      reviews: { select: { rating: true } },
      _count: { select: { requestsReceived: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return technicians.map((t) => {
    const ratingCount = t.reviews.length;
    const ratingAvg = ratingCount > 0 ? t.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount : null;
    return {
      id: t.id,
      userId: t.userId,
      fullName: t.user.fullName,
      phone: t.user.phone,
      avatarUrl: t.user.avatarUrl,
      title: t.title,
      city: t.user.city,
      verified: t.verified,
      planKey: t.plan?.key ?? null,
      startingPrice: t.startingPrice,
      ratingAvg,
      ratingCount,
      jobsCompleted: t._count.requestsReceived,
      createdAt: t.createdAt.toISOString(),
    };
  });
}

export async function getAdminTechnicianDetail(technicianId: string) {
  const t = await prisma.technician.findUnique({
    where: { id: technicianId },
    include: {
      user: { select: { fullName: true, phone: true, email: true, avatarUrl: true, city: true, createdAt: true } },
      plan: { select: { key: true, name: true, commissionRate: true } },
      categories: { select: { name: true } },
    },
  });
  if (!t) return null;

  const [recentRequests, earningsAgg] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { technicianId },
      include: { category: { select: { name: true } }, client: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.aggregate({
      where: { technicianId, type: "PAYOUT" },
      _sum: { amount: true, platformFee: true },
    }),
  ]);

  return {
    id: t.id,
    userId: t.userId,
    fullName: t.user.fullName,
    phone: t.user.phone,
    email: t.user.email,
    avatarUrl: t.user.avatarUrl,
    city: t.user.city,
    title: t.title,
    bio: t.bio,
    yearsExperience: t.yearsExperience,
    startingPrice: t.startingPrice,
    verified: t.verified,
    planKey: t.plan?.key ?? null,
    planName: t.plan?.name ?? null,
    commissionRate: t.plan?.commissionRate ?? null,
    createdAt: t.user.createdAt.toISOString(),
    categories: t.categories.map((c) => c.name),
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      categoryName: r.category.name,
      clientName: r.client.fullName,
    })),
    netEarnings: (earningsAgg._sum.amount ?? 0) - (earningsAgg._sum.platformFee ?? 0),
    feesCollected: earningsAgg._sum.platformFee ?? 0,
  };
}

export async function setTechnicianVerified(technicianId: string, verified: boolean): Promise<void> {
  await prisma.technician.update({ where: { id: technicianId }, data: { verified } });
}

// --- Requests ------------------------------------------------------------

export interface AdminRequest {
  id: string;
  status: string;
  categoryName: string;
  clientFullName: string;
  technicianFullName: string;
  createdAt: string;
  completedAt: string | null;
  clientConfirmedSolved: boolean | null;
}

export async function listAdminRequests(status?: string): Promise<AdminRequest[]> {
  const rows = await prisma.serviceRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      category: { select: { name: true } },
      client: { select: { fullName: true } },
      technician: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    categoryName: r.category.name,
    clientFullName: r.client.fullName,
    technicianFullName: r.technician.user.fullName,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    clientConfirmedSolved: r.clientConfirmedSolved,
  }));
}

// --- Payments -----------------------------------------------------------

export async function listAdminPayments(type?: string) {
  const payments = await prisma.payment.findMany({
    where: type ? { type } : undefined,
    include: {
      technician: { include: { user: { select: { fullName: true, phone: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return payments.map((p) => ({
    id: p.id,
    type: p.type,
    method: p.method,
    status: p.status,
    amount: p.amount,
    platformFee: p.platformFee,
    technicianFullName: p.technician.user.fullName,
    technicianId: p.technicianId,
    requestId: p.requestId,
    createdAt: p.createdAt.toISOString(),
  }));
}

// --- Categories ---------------------------------------------------------

export async function listAdminCategories() {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { technicians: true, requests: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    color: c.color,
    description: c.description,
    sortOrder: c.sortOrder,
    technicianCount: c._count.technicians,
    requestCount: c._count.requests,
  }));
}

export async function createAdminCategory(input: {
  name: string; icon: string; color: string; description: string | null;
}) {
  const slug = input.name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.category.create({
    data: { slug, name: input.name, icon: input.icon, color: input.color, description: input.description, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}

export async function updateAdminCategory(id: string, input: {
  name: string; icon: string; color: string; description: string | null;
}) {
  await prisma.category.update({ where: { id }, data: input });
}

export async function reorderAdminCategory(id: string, direction: "up" | "down") {
  const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return;
  await prisma.$transaction([
    prisma.category.update({ where: { id: all[idx].id }, data: { sortOrder: all[swapIdx].sortOrder } }),
    prisma.category.update({ where: { id: all[swapIdx].id }, data: { sortOrder: all[idx].sortOrder } }),
  ]);
}

export async function deleteAdminCategory(id: string) {
  await prisma.category.delete({ where: { id } });
}

// --- Plans --------------------------------------------------------------

export async function listAdminPlans() {
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } } },
    orderBy: { price: "asc" },
  });
  return plans.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    price: p.price,
    billingCycle: p.billingCycle,
    commissionRate: p.commissionRate,
    maxRequestsPerMonth: p.maxRequestsPerMonth,
    priorityVisibility: p.priorityVisibility,
    features: p.features,
    badge: p.badge,
    activeSubscriptions: p._count.subscriptions,
  }));
}

export async function updateAdminPlan(
  id: string,
  input: { price: number; commissionRate: number; maxRequestsPerMonth: number | null; badge: string | null }
) {
  await prisma.plan.update({ where: { id }, data: input });
}