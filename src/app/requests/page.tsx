import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listRequestsForClient } from "@/lib/db/requests";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, EmptyState } from "@/components/ui/Card";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { formatRelativeTime } from "@/lib/utils";

export default async function RequestsPage() {
  const session = await requireUser();
  const requests = await listRequestsForClient(session.userId);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-semibold text-ink">My Bookings</p>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No bookings yet"
            description="Once you request a technician, you'll see the job here."
          />
        ) : (
          <div className="flex flex-col gap-3 p-5">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-transform active:scale-[0.98]"
              >
                <CategoryIcon icon={req.categoryIcon} color={req.categoryColor} size={20} badgeSize={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-semibold text-ink">{req.categoryName}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Avatar src={req.technicianAvatarUrl} name={req.technicianFullName} size={16} />
                    <p className="truncate text-xs text-muted">{req.technicianFullName}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">{formatRelativeTime(req.createdAt)}</p>
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