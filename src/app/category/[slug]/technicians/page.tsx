import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { getCategoryBySlug, listTechniciansByCategorySlug } from "@/lib/db/catalog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DARK_BLACK_BG, NAVY_TILE } from "@/lib/theme";
import { TechnicianList } from "./TechnicianList";

export default async function TechnicianListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { slug } = await params;
  const { lat, lng } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const clientLat = lat ? parseFloat(lat) : null;
  const clientLng = lng ? parseFloat(lng) : null;

  const technicians = await listTechniciansByCategorySlug(
    slug,
    clientLat,
    clientLng
  );

  return (
    <div className="app-content no-scrollbar" style={{ background: DARK_BLACK_BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <Link
          href={`/category/${slug}`}
          aria-label="Retour"
          style={{ backgroundColor: NAVY_TILE }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CategoryIcon
            icon={category.icon}
            color={category.color}
            size={16}
            badgeSize={32}
            variant="navy"
          />
          <p className="font-heading text-base font-semibold text-white truncate">
            {category.name} Technicians
          </p>
        </div>
      </div>

      {/* Location notice */}
      {clientLat && clientLng && (
        <div className="flex items-center gap-2 bg-success/15 px-5 py-2.5 border-b border-white/10">
          <MapPin size={13} className="text-success shrink-0" />
          <p className="text-xs font-medium text-success">
            Showing technicians within your plan&apos;s visibility radius
          </p>
        </div>
      )}

      {/* Technician list */}
      <TechnicianList
        technicians={technicians}
        category={category}
        clientLat={clientLat}
        clientLng={clientLng}
      />
    </div>
  );
}