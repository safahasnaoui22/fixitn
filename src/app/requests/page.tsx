import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listRequestsForClient } from "@/lib/db/requests";
import { StatusBadge } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { EmptyState } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";

export default async function RequestsPage() {
  const session = await requireUser();
  if (session.role === "TECHNICIAN") redirect("/t/requests");

  const requests = await listRequestsForClient(session.userId);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-semibold text-ink">
            My Bookings
          </p>
          <p className="text-xs text-muted mt-0.5">
            {requests.length} total
          </p>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No bookings yet"
            description="Book a technician to get started."
          />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors active:bg-surface-alt"
              >
                <CategoryIcon
                  icon={req.categoryIcon}
                  color={req.categoryColor}
                  size={18}
                  badgeSize={42}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold text-ink truncate">
                    {req.categoryName}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {req.technicianFullName}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
      <ClientBottomNav />
    </>
  );
}