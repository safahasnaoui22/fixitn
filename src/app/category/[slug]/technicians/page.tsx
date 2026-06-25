import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCategoryBySlug, listTechniciansByCategorySlug } from "@/lib/db/catalog";
import { TechnicianList } from "./TechnicianList";

export default async function CategoryTechniciansPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const technicians = await listTechniciansByCategorySlug(slug);

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href={`/category/${slug}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-ink">{category.name} Technicians</p>
          <p className="text-xs text-muted">{technicians.length} available nearby</p>
        </div>
      </div>

      <TechnicianList technicians={technicians} categorySlug={slug} />
    </div>
  );
}