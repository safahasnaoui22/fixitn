import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTechnicianById, getCategoryBySlug, listCategoriesForTechnician } from "@/lib/db/catalog";
import { getPublicUserById } from "@/lib/db/users";
import { RequestForm } from "./RequestForm";
import { DARK_BG, NAVY_TILE } from "@/lib/theme";

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
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: DARK_BG }}>
      <div className="app-content no-scrollbar">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Link
            href={`/technician/${id}?category=${resolvedCategory.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: NAVY_TILE }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-heading text-base font-semibold text-white">Request Service</p>
            <p className="text-xs text-white/60">
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
    </div>
  );
}