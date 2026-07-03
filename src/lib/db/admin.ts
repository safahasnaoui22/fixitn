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


export async function getDashboardData() {
  const [
    totalClients,
    totalTechnicians,
    revenue,
    grossRevenue,
    completed,
    pending,
    inProgress,
    terminated,
    recentRequests,
    technicians,
    recentPayments,
    recentNotifications,
    monthly,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "CLIENT" },
    }),

    prisma.technician.count(),

    prisma.payment.aggregate({
      where: { type: "PAYOUT" },
      _sum: {
        platformFee: true,
      },
    }),

    prisma.payment.aggregate({
      where: { type: "PAYOUT" },
      _sum: {
        amount: true,
      },
    }),

    prisma.serviceRequest.count({
      where: { status: "COMPLETED" },
    }),

    prisma.serviceRequest.count({
      where: { status: "PENDING" },
    }),

    prisma.serviceRequest.count({
      where: {
        status: {
          in: [
            "ACCEPTED",
            "ON_THE_WAY",
            "ARRIVED",
            "IN_PROGRESS",
          ],
        },
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: {
          in: [
            "CANCELLED",
            "DECLINED",
          ],
        },
      },
    }),

    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,

        category: {
          select: {
            name: true,
          },
        },

        client: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },

        technician: {
          select: {
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },

        payment: {
          select: {
            amount: true,
          },
        },
      },
    }),

    prisma.technician.findMany({
      select: {
        title: true,

        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },

        reviews: {
          select: {
            rating: true,
          },
        },

        _count: {
          select: {
            requestsReceived: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },

        payments: {
          where: {
            type: "PAYOUT",
          },
          select: {
            amount: true,
            platformFee: true,
          },
        },
      },
    }),

    prisma.payment.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        platformFee: true,
        method: true,
        status: true,
        type: true,
        createdAt: true,

        technician: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    }),

    prisma.notification.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        title: true,
        type: true,
        createdAt: true,

        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),

    prisma.$queryRaw<
      Array<{
        month: string;
        fee: number;
        gross: number;
      }>
    >`
      SELECT
        TO_CHAR("createdAt",'YYYY-MM') AS month,
        SUM("platformFee")::int AS fee,
        SUM("amount")::int AS gross
      FROM "Payment"
      WHERE type='PAYOUT'
      GROUP BY TO_CHAR("createdAt",'YYYY-MM')
      ORDER BY month ASC
      LIMIT 7
    `,
  ]);

  return {
    stats: {
      totalClients,
      totalTechnicians,
      totalJobs:
        completed +
        pending +
        inProgress +
        terminated,

      platformEarnings:
        revenue._sum.platformFee ?? 0,

      totalRevenue:
        grossRevenue._sum.amount ?? 0,
    },

    jobsOverview: {
      completed,
      pending,
      inProgress,
      terminated,
    },

    recentJobs: recentRequests.map((r) => ({
      id: "#" + r.id.slice(0, 6).toUpperCase(),

      service: r.category.name,

      clientName: r.client.fullName,
      clientAvatar: r.client.avatarUrl,

      technicianName: r.technician.user.fullName,
      technicianAvatar: r.technician.user.avatarUrl,

      status: r.status,

      amount: r.payment?.amount ?? null,

      createdAt: r.createdAt.toISOString(),
    })),

    topTechnicians: technicians
      .map((t) => ({
        name: t.user.fullName,

        avatarUrl: t.user.avatarUrl,

        title: t.title,

        jobs: t._count.requestsReceived,

        rating:
          t.reviews.length > 0
            ? t.reviews.reduce(
                (sum, review) => sum + review.rating,
                0
              ) / t.reviews.length
            : null,

        earnings: t.payments.reduce(
          (sum, payment) =>
            sum +
            payment.amount -
            payment.platformFee,
          0
        ),
      }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 5),

    recentPayments: recentPayments.map((payment) => ({
      id: "#" + payment.id.slice(0, 6).toUpperCase(),

      technicianName:
        payment.technician.user.fullName,

      amount: payment.amount,

      platformFee: payment.platformFee,

      method: payment.method,

      status: payment.status,

      type: payment.type,

      createdAt:
        payment.createdAt.toISOString(),
    })),

    recentNotifications:
      recentNotifications.map((notification) => ({
        title: notification.title,

        type: notification.type,

        userName:
          notification.user.fullName,

        createdAt:
          notification.createdAt.toISOString(),
      })),

    monthly: monthly.map((m) => ({
      date: new Date(`${m.month}-01`).toLocaleDateString(
        "en-US",
        {
          month: "short",
        }
      ),

      value: Number(m.gross),

      fee: Number(m.fee),
    })),
  };
}