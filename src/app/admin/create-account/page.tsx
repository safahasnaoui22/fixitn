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

export default async function AdminCreateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
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
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Create Account
          </h1>
          <p className="text-sm text-muted">
            Create any account type with a chosen plan
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            Account created successfully!
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
            New Account Details
          </p>
        </div>

        <Suspense fallback={null}>
          <CreateAccountForm categories={categories} plans={plans} />
        </Suspense>
      </div>

      {/* Role guide */}
      <div className="rounded-2xl border border-line bg-surface-alt p-4">
        <p className="text-sm font-semibold text-ink mb-2">Role guide</p>
        <div className="flex flex-col gap-2 text-xs text-muted">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">CLIENT</span>
            <span>Can browse categories, book technicians, rate jobs.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">TECHNICIAN</span>
            <span>Can receive jobs. Auto-approved when created by admin. Plan determines commission and visibility.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">SOUS_ADMIN</span>
            <span>Can approve/decline technicians and handle support chat. No job access.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-ink shrink-0">ADMIN</span>
            <span>Full access to all platform features.</span>
          </div>
        </div>
      </div>
    </div>
  );
}