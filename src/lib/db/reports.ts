import { prisma } from "./client";

export const PERIODS = {
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  "12m": { label: "Last 12 months", days: 365 },
} as const;
export type PeriodKey = keyof typeof PERIODS;
export type GroupKey = "week" | "month";

export interface Bucket {
  label: string;
  requests: number;
  completed: number;
  cancelled: number;
  revenue: number; // paid amount (DT)
  platform: number; // platform fees (DT)
}
export interface RegionRow {
  region: string;
  requests: number;
  completed: number;
  revenue: number;
  platform: number;
}

function mondayOf(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x.toISOString().slice(0, 10);
}

export async function buildReport(period: PeriodKey, group: GroupKey) {
  const from = new Date(Date.now() - PERIODS[period].days * 24 * 3600 * 1000);
  const rows = await prisma.serviceRequest.findMany({
    where: { createdAt: { gte: from } },
    select: {
      createdAt: true,
      status: true,
      client: { select: { city: true } },
      payment: { select: { amount: true, platformFee: true, status: true } },
    },
  });

  const buckets = new Map<string, Bucket>();
  const regions = new Map<string, RegionRow>();

  for (const r of rows) {
    const key = group === "week" ? mondayOf(r.createdAt) : r.createdAt.toISOString().slice(0, 7);
    const b = buckets.get(key) ?? { label: key, requests: 0, completed: 0, cancelled: 0, revenue: 0, platform: 0 };
    const region = (r.client.city ?? "").trim() || "Unknown";
    const g = regions.get(region) ?? { region, requests: 0, completed: 0, revenue: 0, platform: 0 };
    const paid = r.payment && r.payment.status === "PAID";

    b.requests++;
    g.requests++;
    if (r.status === "COMPLETED") {
      b.completed++;
      g.completed++;
    }
    if (r.status === "CANCELLED" || r.status === "DECLINED") b.cancelled++;
    if (paid) {
      b.revenue += r.payment!.amount;
      b.platform += r.payment!.platformFee;
      g.revenue += r.payment!.amount;
      g.platform += r.payment!.platformFee;
    }
    buckets.set(key, b);
    regions.set(region, g);
  }

  return {
    timeline: [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label)),
    regions: [...regions.values()].sort((a, b) => b.requests - a.requests),
    total: rows.length,
  };
}

export function toCsv(header: string[], lines: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens accents correctly
  return "﻿" + [header, ...lines].map((l) => l.map(esc).join(",")).join("\n");
}
