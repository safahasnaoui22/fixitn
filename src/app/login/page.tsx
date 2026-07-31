import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "TECHNICIAN") redirect("/t/dashboard");
    if (session.role === "ADMIN") redirect("/admin");
    redirect("/");
  }

  return (
    <div className="app-content px-6 py-8">
      <Link href="/onboarding" className="text-sm text-muted">
        &larr; Back
      </Link>
      <h1 className="font-heading mt-6 text-2xl font-bold text-ink">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted">Log in to continue to FixiTN</p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}