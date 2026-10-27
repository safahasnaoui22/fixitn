
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, TrendingUp, Briefcase, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getTechnicianByUserId,
  getTechnicianStats,
} from "@/lib/db/catalog";
import {
  getTechnicianDashboardStats,
  listRequestsForTechnician,
} from "@/lib/db/requests";
import { getTechnicianEarnings } from "@/lib/db/monetization";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { TechBottomNav } from "@/components/TechBottomNav";
import { formatDT, formatRelativeTime } from "@/lib/utils";

const COLORS = {
  background: "#081426",
  header: "#0b1930",
  card: "#0c1a30",
  cardAlt: "#142541",
  border: "#2a3b56",
  text: "#f1f5f9",
  muted: "#b8c7dc",
  orange: "#f97316",
};

export default async function TechDashboardPage() {
  const session = await requireRole("TECHNICIAN");

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [
    dashStats,
    profileStats,
    earnings,
    activeRequests,
    unread,
  ] = await Promise.all([
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
      <div
        className="app-content no-scrollbar min-h-full"
        style={{
          backgroundColor: COLORS.background,
          color: COLORS.text,
        }}
      >
        {/* Header */}
        <div
          className="px-5 pb-6 pt-6 text-white"
          style={{ backgroundColor: COLORS.header }}
        >
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={technician.avatarUrl}
                name={technician.fullName}
                size={44}
              />

              <div className="min-w-0">
                <p className="text-xs text-white/60">Welcome back</p>
                <p className="truncate font-heading text-base font-semibold text-white">
                  {technician.fullName.split(" ")[0]}
                </p>
              </div>
            </div>

            <Link
              href="/notifications"
              aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              style={{ backgroundColor: "#172947" }}
            >
              <Bell size={20} className="text-white" />

              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>

          {/* Earnings */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <EarningBox label="Today" value={formatDT(earnings.today)} />
            <EarningBox label="This month" value={formatDT(earnings.thisMonth)} />
            <EarningBox label="Total" value={formatDT(earnings.total)} />
          </div>
        </div>

        <div className="flex flex-col gap-6 px-5 py-5">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={Clock}
              label="New today"
              value={String(dashStats.newToday)}
              color="text-[#fb923c]"
            />

            <StatCard
              icon={Briefcase}
              label="In progress"
              value={String(dashStats.inProgress)}
              color="text-[#60a5fa]"
            />

            <StatCard
              icon={TrendingUp}
              label="Completed"
              value={String(profileStats.jobsCompleted)}
              color="text-[#4ade80]"
            />
          </div>

          {/* Active jobs */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-heading text-sm font-semibold text-white">
                Active Jobs
              </p>

              <Link
                href="/t/requests"
                className="text-xs font-medium text-[#fb923c] hover:text-[#fdba74]"
              >
                View all
              </Link>
            </div>

            {activeRequests.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 rounded-2xl border py-8 text-center"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                }}
              >
                <Briefcase size={28} className="text-[#94a3b8]" />

                <p className="text-sm font-medium text-[#d0dbea]">
                  No active jobs
                </p>

                <p className="text-xs text-[#94a3b8]">
                  New requests will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeRequests.slice(0, 4).map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="flex items-center gap-3 rounded-2xl border p-3 transition-colors active:scale-[0.98] hover:bg-[#172947]"
                    style={{
                      backgroundColor: COLORS.card,
                      borderColor: COLORS.border,
                    }}
                  >
                    <CategoryIcon
                      icon={req.categoryIcon}
                      color={req.categoryColor}
                      size={20}
                      badgeSize={44}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-semibold text-white">
                        {req.categoryName}
                      </p>

                      <p className="truncate text-xs text-[#b8c7dc]">
                        {req.clientFullName}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                        {formatRelativeTime(req.createdAt)}
                      </p>
                    </div>

                    <StatusBadge status={req.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/t/earnings"
              className="flex flex-col gap-1.5 rounded-2xl border p-4 transition-colors hover:bg-[#172947]"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              <TrendingUp size={20} className="text-[#fb923c]" />

              <p className="font-heading text-sm font-semibold text-white">
                Earnings
              </p>

              <p className="text-xs text-[#b8c7dc]">
                View full history
              </p>
            </Link>

            <Link
              href="/plans"
              className="flex flex-col gap-1.5 rounded-2xl border border-[#9a4b1b] bg-[#2b1d1a] p-4 transition-colors hover:bg-[#3a261e]"
            >
              <Briefcase size={20} className="text-[#fb923c]" />

              <p className="font-heading text-sm font-semibold text-[#fdba74]">
                Upgrade Plan
              </p>

              <p className="text-xs text-[#fdba74]/75">
                Lower your commission
              </p>
            </Link>
          </div>
        </div>
      </div>

      <TechBottomNav />
    </>
  );
}

function EarningBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-0.5 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: "#172947" }}
    >
      <p className="text-[10px] text-[#b8c7dc]">{label}</p>

      <p className="truncate font-heading text-sm font-bold text-white">
        {value}
      </p>
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
    <div
      className="flex flex-col items-center gap-1 rounded-2xl border py-4 text-center"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
      }}
    >
      <Icon size={18} className={color} />

      <p className="font-heading text-xl font-bold text-white">
        {value}
      </p>

      <p className="text-[10px] text-[#b8c7dc]">{label}</p>
    </div>
  );
}
