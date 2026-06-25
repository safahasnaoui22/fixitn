import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTechnicianById, getCategoryBySlug, listCategoriesForTechnician } from "@/lib/db/catalog";
import { getPublicUserById } from "@/lib/db/users";
import { RequestForm } from "./RequestForm";

export default async function RequestServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await requireUser();
  if (session.role !== "CLIENT") redirect("/");

  const { id } = await params;
  const { category: categorySlug } = await searchParams;

  const technician = await getTechnicianById(id);
  if (!technician) notFound();

  const directCategory = categorySlug ? await getCategoryBySlug(categorySlug) : null;
  const fallbackCategories = directCategory ? [] : await listCategoriesForTechnician(id);
  const resolvedCategory = directCategory ?? fallbackCategories[0];
  if (!resolvedCategory) notFound();

  const user = await getPublicUserById(session.userId);

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href={`/technician/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">Request Service</p>
          <p className="text-xs text-muted">
            {technician.fullName} · {resolvedCategory.name}
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        <Suspense fallback={null}>
          <RequestForm
            technicianId={technician.id}
            categoryId={resolvedCategory.id}
            defaultFullName={user?.fullName ?? ""}
            defaultPhone={user?.phone ?? ""}
            defaultAddress={user?.address ?? ""}
          />
        </Suspense>
      </div>
    </div>
  );
}