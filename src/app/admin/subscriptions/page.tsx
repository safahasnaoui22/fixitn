import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDate, formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { tOr } from "@/lib/i18n/translate";
import { notifyAllExpiringAction, notifySubscriptionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  await requireRole("ADMIN");
  const t = await getT();
  const locale = await getLocale();
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const include = {
    plan: { select: { name: true, key: true, price: true } },
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
          {s.technician.user.phone} · {tOr(t, `plan.${s.plan.key}`, s.plan.name)} ({formatDT(s.plan.price, locale)})
        </p>
      </div>
      <p className="text-xs text-muted">
        {s.expiresAt ? t("adminOps.subs.expires", { date: formatDate(s.expiresAt.toISOString(), locale) }) : ""}
      </p>
      <form action={notifySubscriptionAction.bind(null, s.id)}>
        <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange">
          {t("adminOps.subs.sendReminder")}
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.subs.title")}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {t("adminOps.subs.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminOps.subs.expiring7")}</p>
          <p className="font-heading text-2xl font-bold text-ink">{expiring.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminOps.subs.atStake")}</p>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(atStake, locale)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminOps.subs.renewals30")}</p>
          <p className="font-heading text-2xl font-bold text-ink">{formatDT(renewals._sum.amount ?? 0, locale)}</p>
          <p className="text-[11px] text-muted">{t("adminOps.subs.paymentsCount", { n: renewals._count._all })}</p>
        </div>
      </div>

      <form action={notifyAllExpiringAction}>
        <button className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white">
          {t("adminOps.subs.notifyAll")}
        </button>
      </form>

      <div>
        <h2 className="mb-2 font-heading text-lg font-bold text-ink">{t("adminOps.subs.expiringTitle")}</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {expiring.length === 0 && <p className="px-4 py-6 text-sm text-muted">{t("adminOps.subs.nothingExpiring")}</p>}
          {expiring.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-heading text-lg font-bold text-ink">{t("adminOps.subs.expiredTitle")}</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {expired.length === 0 && <p className="px-4 py-6 text-sm text-muted">{t("adminOps.subs.none")}</p>}
          {expired.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
