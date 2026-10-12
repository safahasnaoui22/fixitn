import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { AuthBackground } from "@/components/AuthBackground";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICIAN" ? "/t/dashboard" : "/");

  const categories = await listCategories();

  return (
    <AuthBackground>
      <Link href="/onboarding" className="text-sm text-white/70">
        &larr; Back
      </Link>
      <h1 className="font-heading mt-6 text-2xl font-bold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-white/70">Join FixiTN as a client or a technician</p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <RegisterForm categories={categories} />
        </Suspense>
      </div>
    </AuthBackground>
  );
}