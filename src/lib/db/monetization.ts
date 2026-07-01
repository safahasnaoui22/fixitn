import { prisma } from "./client";
import { parseStringArray } from "../utils";
import type { Plan, Payment } from "../types";
import type { BillingCycle, PaymentMethod, PaymentStatus, PaymentType, PlanKey } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlan(p: any): Plan {
  return {
    id: p.id,
    key: p.key as PlanKey,
    name: p.name,
    price: p.price,
    billingCycle: p.billingCycle as BillingCycle,
    commissionRate: p.commissionRate,
    maxRequestsPerMonth: p.maxRequestsPerMonth,
    priorityVisibility: p.priorityVisibility,
    features: parseStringArray(p.features),
    badge: p.badge,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayment(p: any): Payment {
  return {
    id: p.id,
    technicianId: p.technicianId,
    requestId: p.requestId,
    amount: p.amount,
    platformFee: p.platformFee,
    method: p.method as PaymentMethod,
    status: p.status as PaymentStatus,
    type: p.type as PaymentType,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

export async function listPlans(): Promise<Plan[]> {
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  return plans.map(mapPlan);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const p = await prisma.plan.findUnique({ where: { id } });
  return p ? mapPlan(p) : null;
}

export async function subscribeTechnicianToPlan(
  technicianId: string,
  planId: string
): Promise<void> {
  const plan = await getPlanById(planId);
  if (!plan) return;

  let expiresAt: Date | null = null;
  if (plan.billingCycle === "MONTHLY") {
    expiresAt = new Date(Date.now() + 30 * 86400000);
  } else if (plan.billingCycle === "YEARLY") {
    expiresAt = new Date(Date.now() + 365 * 86400000);
  }

  await prisma.subscription.updateMany({
    where: { technicianId, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  await prisma.subscription.create({
    data: { technicianId, planId, expiresAt, status: "ACTIVE" },
  });

  await prisma.technician.update({
    where: { id: technicianId },
    data: { planId },
  });

  if (plan.price > 0) {
    await prisma.payment.create({
      data: {
        technicianId,
        amount: plan.price,
        platformFee: 0,
        method: "D17",
        status: "PAID",
        type: "SUBSCRIPTION",
      },
    });
  }
}

export async function getTechnicianEarnings(
  technicianId: string
): Promise<{ today: number; thisMonth: number; total: number }> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayAgg, monthAgg, totalAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { technicianId, type: "PAYOUT", createdAt: { gte: startOfToday } },
      _sum: { amount: true, platformFee: true },
    }),
    prisma.payment.aggregate({
      where: { technicianId, type: "PAYOUT", createdAt: { gte: startOfMonth } },
      _sum: { amount: true, platformFee: true },
    }),
    prisma.payment.aggregate({
      where: { technicianId, type: "PAYOUT" },
      _sum: { amount: true, platformFee: true },
    }),
  ]);

  const net = (agg: { _sum: { amount: number | null; platformFee: number | null } }) =>
    (agg._sum.amount ?? 0) - (agg._sum.platformFee ?? 0);

  return {
    today: net(todayAgg),
    thisMonth: net(monthAgg),
    total: net(totalAgg),
  };
}

export async function listPaymentsForTechnician(
  technicianId: string,
  limit = 20
): Promise<Payment[]> {
  const payments = await prisma.payment.findMany({
    where: { technicianId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return payments.map(mapPayment);
}