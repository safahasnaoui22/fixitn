import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDate, formatDT } from "@/lib/utils";
import { notifyAllExpiringAction, notifySubscriptionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const include = {
    plan: { select: { name: true, price: true } },
    technician: { select: { user: { select: { fullName: true, phone: true } } } },
  } as const;

  const [expiring, expired, renewals] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7 } },
      orderBy: { expiresAt: "asc" },
      include,
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      orderBy: { expiresAt: "desc" },
      take: 50,
      include,
    }),
    prisma.payment.aggregate({
      where: { type: "SUBSCRIPTION", status: "PAID", createdAt: { gte: ago30 } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const atStake = expiring.reduce((s, x) => s + x.plan.price, 0);

  const Row = ({ s }: { s: (typeof expiring)[number] }) => (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{s.technician.user.fullName}</p>
        <p className="text-xs text-muted">
          {s.technician.user.phone} · {s.plan.name} ({formatDT(s.plan.price)})
        </p>
      </div>
      <p className="text-xs text-muted">
        {s.expiresAt ? `Expires ${formatDate(s.expiresAt.toISOString())}` : ""}
      </p>
      <form action={notifySubscriptionAction.bind(null, s.id)}>
        <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange">
          Send reminder
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Plan alerts</h1>
        <p className="mt-0.5 text-sm text-muted">
          Plans that expire soon, plans already expired, and renewal revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Expiring in 7 days</p>
          <p className="font-heading text-2xl font-bold text-ink">{expiring.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Revenue at stake if they renew</p>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(atStake)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Renewal revenue, last 30 days</p>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(renewals._sum.amount ?? 0)}</p>
          <p className="text-[11px] text-muted">{renewals._count._all} payment(s)</p>
        </div>
      </div>

      <form action={notifyAllExpiringAction}>
        <button className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white">
          Send a reminder to everyone expiring or expired
        </button>
      </form>

      <div>
        <h2 className="mb-2 font-heading text-lg font-bold text-ink">Expiring in the next 7 days</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {expiring.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nothing expiring.</p>}
          {expiring.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-heading text-lg font-bold text-ink">Expired, not renewed</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {expired.length === 0 && <p className="px-4 py-6 text-sm text-muted">None.</p>}
          {expired.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
