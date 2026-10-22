
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import {
  getUnreadSupportCount,
  listSupportConversations,
} from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

async function getDashboardStats(userId: string) {
  const [pending, active, declined, archived, unread] = await Promise.all([
    prisma.technician.count({
      where: { accountStatus: "PENDING" },
    }),
    prisma.technician.count({
      where: { accountStatus: "ACTIVE" },
    }),
    prisma.technician.count({
      where: { accountStatus: "DECLINED" },
    }),
    prisma.technician.count({
      where: { accountStatus: "ARCHIVED" },
    }),
    getUnreadSupportCount(userId).catch((error) => {
      console.error("Dashboard unread support count error:", error);
      return 0;
    }),
  ]);

  return { pending, active, declined, archived, unread };
}

async function getRecentPending() {
  return prisma.technician.findMany({
    where: { accountStatus: "PENDING" },
    include: {
      user: {
        select: {
          fullName: true,
          phone: true,
          avatarUrl: true,
          city: true,
          createdAt: true,
        },
      },
      plan: {
        select: { key: true, name: true },
      },
      categories: {
        select: { name: true },
        take: 2,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function SousAdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "SOUS_ADMIN") {
    redirect("/");
  }

  const [stats, pending, conversations] = await Promise.all([
    getDashboardStats(session.userId),
    getRecentPending(),
    listSupportConversations(session.userId).catch((error) => {
      console.error("Dashboard support conversations error:", error);
      return [];
    }),
  ]);

  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Welcome back, {session.fullName}
        </p>
      </div>

      {/* Statistics */}
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

      {/* Dashboard panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending technicians */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-ink">
              Pending Approval
            </h2>

            <Link
              href="/sous-admin/technicians?status=PENDING"
              prefetch={false}
              className="text-sm font-medium text-brand-orange hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
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
                  href="/sous-admin/technicians?status=PENDING"
                  prefetch={false}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-alt"
                >
                  <Avatar
                    src={tech.user.avatarUrl}
                    name={tech.user.fullName}
                    size={40}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {tech.user.fullName}
                    </p>

                    <p className="text-xs text-muted">
                      {tech.title}
                      {tech.categories.length > 0 &&
                        ` · ${tech.categories
                          .map((category) => category.name)
                          .join(", ")}`}
                    </p>

                    <p className="text-[10px] text-muted">
                      {formatRelativeTime(
                        tech.user.createdAt.toISOString()
                      )}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Pending
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent support conversations */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-ink">
              Support Messages
            </h2>

            <Link
              href="/sous-admin/support"
              prefetch={false}
              className="text-sm font-medium text-brand-orange hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {recentConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MessageCircle size={28} className="text-muted" />
                <p className="text-sm text-muted">
                  No support messages yet
                </p>
              </div>
            ) : (
              recentConversations.map((conversation) => (
                <Link
                  key={conversation.userId}
                  href={`/sous-admin/support/${conversation.userId}`}
                  prefetch={false}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-alt"
                >
                  <div className="relative">
                    <Avatar
                      src={conversation.avatarUrl}
                      name={conversation.fullName}
                      size={40}
                    />

                    {conversation.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {conversation.fullName}
                      </p>

                      <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted">
                        {conversation.role === "TECHNICIAN"
                          ? "Tech"
                          : conversation.role === "CLIENT"
                            ? "Client"
                            : conversation.role}
                      </span>
                    </div>

                    <p className="truncate text-xs text-muted">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-muted">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  urgent = false,
}: {
  icon: typeof Clock;
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
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={20} />
      </div>

      <p className="font-heading text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
