import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <div className="app-content px-6 py-8">
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-sm text-muted"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t("forgot.back")}
      </Link>

      <div className="mt-8 flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-light">
          <ShieldCheck size={32} className="text-brand-orange" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          {t("forgot.title")}
        </h1>
        <p className="text-sm text-muted max-w-xs leading-relaxed">
          {t("forgot.text")}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Link
          href="/forgot-password/face"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
        >
          <ShieldCheck size={20} />
          {t("forgot.verify")}
        </Link>

        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-2xl border border-line py-4 text-sm font-semibold text-muted"
        >
          {t("forgot.backToLogin")}
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        {t("forgot.noAccess")}{" "}
        <span dir="ltr" className="text-brand-orange">support@fixili.tn</span>
      </p>
    </div>
  );
}