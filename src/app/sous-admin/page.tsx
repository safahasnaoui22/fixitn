import Link from "next/link";
import { Wrench, MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getUnreadSupportCount, listSupportConversations } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

async function getDashboardStats(userId: string) {
  const [pending, active, declined, archived, unread] = await Promise.all([
    prisma.technician.count({ where: { accountStatus: "PENDING" } }),
    prisma.technician.count({ where: { accountStatus: "ACTIVE" } }),
    prisma.technician.count({ where: { accountStatus: "DECLINED" } }),
    prisma.technician.count({ where: { accountStatus: "ARCHIVED" } }),
    getUnreadSupportCount(userId),
  ]);
  return { pending, active, declined, archived, unread };
}

async function getRecentPending() {
  return prisma.technician.findMany({
    where: { accountStatus: "PENDING" },
    include: {
      user: { select: { fullName: true, phone: true, avatarUrl: true, city: true, createdAt: true } },
      plan: { select: { key: true, name: true } },
      categories: { select: { name: true }, take: 2 },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function SousAdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "SOUS_ADMIN") redirect("/login");

  const [stats, pending, conversations] = await Promise.all([
    getDashboardStats(session.userId),
    getRecentPending(),
    listSupportConversations(session.userId),
  ]);

  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Dashboard
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Welcome back, {session.fullName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending Approval"
          value={String(stats.pending)}
          color="bg-amber-50 text-amber-600"
          urgent={stats.pending > 0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Technicians"
          value={String(stats.active)}
          color="bg-success-light text-success"
        />
        <StatCard
          icon={XCircle}
          label="Declined / Archived"
          value={String(stats.declined + stats.archived)}
          color="bg-danger-light text-danger"
        />
        <StatCard
          icon={MessageCircle}
          label="Unread Messages"
          value={String(stats.unread)}
          color="bg-blue-50 text-blue-600"
          urgent={stats.unread > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending technicians */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-base font-semibold text-ink">
              Pending Approval
            </p>
            <Link
              href="/sous-admin/technicians?status=PENDING"
              className="text-sm font-medium text-brand-orange hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCircle2 size={28} className="text-success" />
                <p className="text-sm text-muted">
                  No pending technicians — you&apos;re all caught up!
                </p>
              </div>
            ) : (
              pending.map((tech) => (
                <Link
                  key={tech.id}
                  href={`/sous-admin/technicians?status=PENDING`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors"
                >
                  <Avatar
                    src={tech.user.avatarUrl}
                    name={tech.user.fullName}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {tech.user.fullName}
                    </p>
                    <p className="text-xs text-muted">
                      {tech.title}
                      {tech.categories.length > 0 &&
                        ` · ${tech.categories.map((c) => c.name).join(", ")}`}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatRelativeTime(tech.user.createdAt.toISOString())}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shrink-0">
                    Pending
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent support conversations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-base font-semibold text-ink">
              Support Messages
            </p>
            <Link
              href="/sous-admin/support"
              className="text-sm font-medium text-brand-orange hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {recentConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MessageCircle size={28} className="text-muted" />
                <p className="text-sm text-muted">No support messages yet</p>
              </div>
            ) : (
              recentConversations.map((conv) => (
                <Link
                  key={conv.userId}
                  href={`/sous-admin/support/${conv.userId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors"
                >
                  <div className="relative">
                    <Avatar
                      src={conv.avatarUrl}
                      name={conv.fullName}
                      size={40}
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink truncate">
                        {conv.fullName}
                      </p>
                      <span className="text-[10px] text-muted shrink-0 rounded-full border border-line px-1.5 py-0.5">
                        {conv.role === "TECHNICIAN" ? "Tech" : conv.role === "CLIENT" ? "Client" : conv.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted shrink-0">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  urgent,
}: {
  icon: typeof Wrench;
  label: string;
  value: string;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface p-4 ${
        urgent ? "border-amber-200" : "border-line"
      }`}
    >
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}
      >
        <Icon size={20} />
      </div>
      <p className="font-heading text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}