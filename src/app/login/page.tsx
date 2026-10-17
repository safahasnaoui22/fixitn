import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthBackground } from "@/components/AuthBackground";
import { LoginForm } from "./LoginForm";
import { getT } from "@/lib/i18n/server";
import { FacePreloader } from "@/components/FacePreloader";
import { InstallAppButton } from "@/components/InstallAppButton";
import { LanguageToggle } from "@/components/LanguageToggle";

export default async function LoginPage() {
  const t = await getT();
  const session = await getSession();
  if (session) {
    if (session.role === "TECHNICIAN") redirect("/t/dashboard");
    if (session.role === "ADMIN") redirect("/admin");
    redirect("/");
  }

  return (
    <AuthBackground>
      <div className="flex items-center justify-between">
        <Link href="/onboarding" className="text-sm text-white/70">
          <span className="inline-block rtl:rotate-180">&larr;</span> {t("login.back")}
        </Link>
        <LanguageToggle />
      </div>
      <h1 className="font-heading mt-6 text-2xl font-bold text-white">
        {t("login.title")}
      </h1>
      <p className="mt-1 text-sm text-white/70">{t("login.subtitle")}</p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      <FacePreloader />
      <InstallAppButton />
    </AuthBackground>
  );
}
