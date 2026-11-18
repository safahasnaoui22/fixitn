import { redirect } from "next/navigation";
import { Wallet, CreditCard, Building2, Banknote, Clock } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { getTechnicianEarnings } from "@/lib/db/monetization";
import { TechBottomNav } from "@/components/TechBottomNav";
import { Button } from "@/components/ui/Button";
import { formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { requestPayoutAction } from "./actions";

const METHODS = [
  {
    value: "FLOUCI",
    label: "paymentMethod.FLOUCI",
    icon: CreditCard,
    desc: "tech.payout.descFlouci",
  },
  {
    value: "D17",
    label: "paymentMethod.D17",
    icon: CreditCard,
    desc: "tech.payout.descD17",
  },
  {
    value: "BANK_TRANSFER",
    label: "paymentMethod.BANK_TRANSFER",
    icon: Building2,
    desc: "tech.payout.descBank",
  },
  {
    value: "CASH",
    label: "paymentMethod.CASH",
    icon: Banknote,
    desc: "tech.payout.descCash",
  },
];

export default async function TechPayoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
  const t = await getT();
  const locale = await getLocale();
  const { error } = await searchParams;

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const earnings = await getTechnicianEarnings(technician.id);

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-5">{t("tech.payout.title")}</p>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm text-white/60">{t("tech.earnings.totalNet")}</p>
            <p className="font-heading text-3xl font-bold text-white mt-1">
              {formatDT(earnings.total, locale)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[10px] text-white/60">{t("tech.dash.today")}</p>
                <p className="text-sm font-bold text-white">{formatDT(earnings.today, locale)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[10px] text-white/60">{t("tech.dash.thisMonth")}</p>
                <p className="text-sm font-bold text-white">{formatDT(earnings.thisMonth, locale)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {error && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {decodeURIComponent(error)}
            </p>
          )}

          {/* Processing note */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {t("tech.payout.note")}
            </p>
          </div>

          {/* Form */}
          <form action={requestPayoutAction} className="flex flex-col gap-4">
            <p className="font-heading text-sm font-semibold text-ink">
              {t("tech.payout.chooseMethod")}
            </p>

            {METHODS.map(({ value, label, icon: Icon, desc }) => (
              <label
                key={value}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 cursor-pointer has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light transition-colors"
              >
                <input type="radio" name="method" value={value} className="sr-only" required />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt">
                  <Icon size={18} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{t(label)}</p>
                  <p className="text-xs text-muted">{t(desc)}</p>
                </div>
              </label>
            ))}

            <div>
              <label className="text-sm font-medium text-ink">
                {t("tech.payout.accountRef")}
              </label>
              <input
                name="accountRef"
                placeholder={t("tech.payout.accountRefPlaceholder")}
                dir="ltr"
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
              />
              <p className="text-xs text-muted mt-1">
                {t("tech.payout.accountRefHint")}
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={earnings.total <= 0}
            >
              <Wallet size={18} />
              {t("tech.payout.requestBtn", { amount: formatDT(earnings.total, locale) })}
            </Button>

            {earnings.total <= 0 && (
              <p className="text-center text-sm text-muted">
                {t("tech.payout.noBalance")}
              </p>
            )}
          </form>

          <Link
            href="/t/payout/history"
            className="text-center text-sm font-medium text-brand-orange"
          >
            {t("tech.payout.viewHistory")}
          </Link>
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}