import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { AuthBackground } from "@/components/AuthBackground";
import { RegisterForm } from "./RegisterForm";
import { getT } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const t = await getT();
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICIAN" ? "/t/requests" : "/");

  const categories = await listCategories();

  return (
    <AuthBackground>
      <Link href="/onboarding" className="text-sm text-white/70">
        <span className="inline-block rtl:rotate-180">&larr;</span> {t("common.back")}
      </Link>
      <h1 className="font-heading mt-6 text-2xl font-bold text-white">{t("auth.register.pageTitle")}</h1>
      <p className="mt-1 text-sm text-white/70">{t("auth.register.pageSubtitle")}</p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <RegisterForm categories={categories} />
        </Suspense>
      </div>
    </AuthBackground>
  );
}