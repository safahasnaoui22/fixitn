import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICIAN" ? "/t/dashboard" : "/");

  const categories = await listCategories();

  return (
    <div className="app-content px-6 py-8">
      <Link href="/onboarding" className="text-sm text-muted">
        &larr; Back
      </Link>
      <h1 className="font-heading mt-6 text-2xl font-bold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Join FixiTN as a client or a technician</p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <RegisterForm categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}