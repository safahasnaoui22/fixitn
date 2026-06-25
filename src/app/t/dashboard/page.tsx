import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, TrendingUp, Briefcase, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId, getTechnicianStats } from "@/lib/db/catalog";
import { getTechnicianDashboardStats, listRequestsForTechnician } from "@/lib/db/requests";
import { getTechnicianEarnings } from "@/lib/db/monetization";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { TechBottomNav } from "@/components/TechBottomNav";
import { formatDT, formatRelativeTime } from "@/lib/utils";

export default async function TechDashboardPage() {
  const session = await requireRole("TECHNICIAN");

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [dashStats, profileStats, earnings, activeRequests, unread] = await Promise.all([
    getTechnicianDashboardStats(technician.id),
    getTechnicianStats(technician.id),
    getTechnicianEarnings(technician.id),
    listRequestsForTechnician(technician.id, [
      "PENDING",
      "ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_PROGRESS",
    ]),
    unreadNotificationCount(session.userId),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="bg-brand-navy px-5 pb-6 pt-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={technician.avatarUrl} name={technician.fullName} size={44} />
              <div>
                <p className="text-xs text-white/60">Welcome back</p>
                <p className="font-heading text-base font-semibold">
                  {technician.fullName.split(" ")[0]}
                </p>
              </div>
            </div>
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <EarningBox label="Today" value={formatDT(earnings.today)} />
            <EarningBox label="This month" value={formatDT(earnings.thisMonth)} />
            <EarningBox label="Total" value={formatDT(earnings.total)} />
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Clock} label="New today" value={String(dashStats.newToday)} color="text-brand-orange" />
            <StatCard icon={Briefcase} label="In progress" value={String(dashStats.inProgress)} color="text-blue-500" />
            <StatCard icon={TrendingUp} label="Completed" value={String(profileStats.jobsCompleted)} color="text-success" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading text-sm font-semibold text-ink">Active Jobs</p>
              <Link href="/t/requests" className="text-xs font-medium text-brand-orange">
                View all
              </Link>
            </div>

            {activeRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface-alt py-8 text-center">
                <Briefcase size={28} className="text-muted" />
                <p className="text-sm font-medium text-muted">No active jobs</p>
                <p className="text-xs text-muted">New requests will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeRequests.slice(0, 4).map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-transform active:scale-[0.98]"
                  >
                    <CategoryIcon icon={req.categoryIcon} color={req.categoryColor} size={20} badgeSize={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-semibold text-ink">
                        {req.categoryName}
                      </p>
                      <p className="truncate text-xs text-muted">{req.clientFullName}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <Link href="/t/earnings" className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4">
              <TrendingUp size={20} className="text-brand-orange" />
              <p className="font-heading text-sm font-semibold text-ink">Earnings</p>
              <p className="text-xs text-muted">View full history</p>
            </Link>
            <Link href="/plans" className="flex flex-col gap-1.5 rounded-2xl border border-brand-orange bg-brand-orange-light p-4">
              <Briefcase size={20} className="text-brand-orange" />
              <p className="font-heading text-sm font-semibold text-brand-orange-dark">Upgrade Plan</p>
              <p className="text-xs text-brand-orange-dark/70">Lower your commission</p>
            </Link>
          </div>
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}

function EarningBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white/10 px-3 py-2.5">
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="font-heading text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-4 text-center">
      <Icon size={18} className={color} />
      <p className="font-heading text-xl font-bold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}