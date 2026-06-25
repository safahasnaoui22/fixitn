import { db, dbReady, genId } from "./client";
import { parseStringArray } from "../utils";
import type { Plan, Payment } from "../types";
import type { BillingCycle, PaymentMethod, PaymentStatus, PaymentType, PlanKey } from "../constants";

function now(): string {
  return new Date().toISOString();
}

function mapPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    key: row.key as PlanKey,
    name: row.name as string,
    price: row.price as number,
    billingCycle: row.billingCycle as BillingCycle,
    commissionRate: row.commissionRate as number,
    maxRequestsPerMonth: (row.maxRequestsPerMonth as number | null) ?? null,
    priorityVisibility: Boolean(row.priorityVisibility),
    features: parseStringArray(row.features as string | null),
    badge: (row.badge as string | null) ?? null,
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    technicianId: row.technicianId as string,
    requestId: (row.requestId as string | null) ?? null,
    amount: row.amount as number,
    platformFee: row.platformFee as number,
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    type: row.type as PaymentType,
    createdAt: row.createdAt as string,
  };
}

export async function listPlans(): Promise<Plan[]> {
  await dbReady;
  const res = await db.execute("SELECT * FROM Plan ORDER BY price ASC");
  return res.rows.map((r) => mapPlan(r as unknown as Record<string, unknown>));
}

export async function getPlanById(id: string): Promise<Plan | null> {
  await dbReady;
  const res = await db.execute({ sql: "SELECT * FROM Plan WHERE id = ?", args: [id] });
  const row = res.rows[0];
  return row ? mapPlan(row as unknown as Record<string, unknown>) : null;
}

export async function subscribeTechnicianToPlan(
  technicianId: string,
  planId: string
): Promise<void> {
  await dbReady;
  const plan = await getPlanById(planId);
  if (!plan) return;

  const ts = now();
  let expiresAt: string | null = null;
  if (plan.billingCycle === "MONTHLY") {
    expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  } else if (plan.billingCycle === "YEARLY") {
    expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
  }

  await db.execute({
    sql: "UPDATE Subscription SET status = 'CANCELLED' WHERE technicianId = ? AND status = 'ACTIVE'",
    args: [technicianId],
  });
  await db.execute({
    sql: `INSERT INTO Subscription (id, technicianId, planId, startedAt, expiresAt, status)
          VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    args: [genId(), technicianId, planId, ts, expiresAt],
  });
  await db.execute({
    sql: "UPDATE Technician SET planId = ? WHERE id = ?",
    args: [planId, technicianId],
  });

  if (plan.price > 0) {
    await db.execute({
      sql: `INSERT INTO Payment (id, technicianId, amount, platformFee, method, status, type, createdAt)
            VALUES (?, ?, ?, 0, 'D17', 'PAID', 'SUBSCRIPTION', ?)`,
      args: [genId(), technicianId, plan.price, ts],
    });
  }
}

export async function getTechnicianEarnings(
  technicianId: string
): Promise<{ today: number; thisMonth: number; total: number }> {
  await dbReady;
  const res = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN date(createdAt) = date('now') AND type = 'PAYOUT' THEN amount - platformFee ELSE 0 END) as today,
            SUM(CASE WHEN strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now') AND type = 'PAYOUT' THEN amount - platformFee ELSE 0 END) as thisMonth,
            SUM(CASE WHEN type = 'PAYOUT' THEN amount - platformFee ELSE 0 END) as total
          FROM Payment WHERE technicianId = ?`,
    args: [technicianId],
  });
  const row = res.rows[0];
  return {
    today: Number(row?.today ?? 0),
    thisMonth: Number(row?.thisMonth ?? 0),
    total: Number(row?.total ?? 0),
  };
}

export async function listPaymentsForTechnician(
  technicianId: string,
  limit = 20
): Promise<Payment[]> {
  await dbReady;
  const res = await db.execute({
    sql: "SELECT * FROM Payment WHERE technicianId = ? ORDER BY createdAt DESC LIMIT ?",
    args: [technicianId, limit],
  });
  return res.rows.map((r) => mapPayment(r as unknown as Record<string, unknown>));
}