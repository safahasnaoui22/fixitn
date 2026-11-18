import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import { CreateAccountForm } from "./CreateAccountForm";
import { getT } from "@/lib/i18n/server";

export default async function AdminCreateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const t = await getT();
  await requireRole("ADMIN");
  const { error, success } = await searchParams;

  const [categories, plans] = await Promise.all([
    listCategories(),
    listPlans(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            {t("admin.createAccount.title")}
          </h1>
          <p className="text-sm text-muted">
            {t("admin.createAccount.subtitle")}
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            {t("admin.createAccount.success")}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={18} className="text-brand-orange" />
          <p className="font-heading text-base font-semibold text-ink">
            {t("admin.createAccount.detailsTitle")}
          </p>
        </div>

        <Suspense fallback={null}>
          <CreateAccountForm categories={categories} plans={plans} />
        </Suspense>
      </div>

      {/* Role guide */}
      <div className="rounded-2xl border border-line bg-surface-alt p-4">
        <p className="text-sm font-semibold text-ink mb-2">{t("admin.createAccount.roleGuide")}</p>
        <div className="flex flex-col gap-2 text-xs text-muted">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">{t("role.CLIENT")}</span>
            <span>{t("admin.createAccount.guide.client")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">{t("role.TECHNICIAN")}</span>
            <span>{t("admin.createAccount.guide.technician")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">{t("role.SOUS_ADMIN")}</span>
            <span>{t("admin.createAccount.guide.sousAdmin")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">{t("role.ADMIN")}</span>
            <span>{t("admin.createAccount.guide.admin")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}