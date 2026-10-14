import Link from "next/link";
import { Search, MessageCircle, Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

async function getTechniciansWithLastMessage(adminId: string) {
  // Get all technicians
  const technicians = await prisma.technician.findMany({
    include: {
      user: {
        select: {
          id: true, fullName: true, avatarUrl: true,
          phone: true, city: true,
        },
      },
      plan: { select: { name: true, key: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // For each technician get last message + unread count
  const result = await Promise.all(
    technicians.map(async (tech) => {
      const lastMessage = await prisma.supportMessage.findFirst({
        where: {
          OR: [
            { fromUserId: adminId,       toUserId: tech.user.id },
            { fromUserId: tech.user.id,  toUserId: adminId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await prisma.supportMessage.count({
        where: {
          fromUserId: tech.user.id,
          toUserId:   adminId,
          read:       false,
        },
      });

      return {
        technicianId: tech.id,
        userId:       tech.user.id,
        fullName:     tech.user.fullName,
        avatarUrl:    tech.user.avatarUrl,
        phone:        tech.user.phone,
        city:         tech.user.city,
        planName:     tech.plan?.name ?? "Beginner",
        planKey:      tech.plan?.key ?? "BEGINNER",
        isSenior:     tech.isSenior,
        accountStatus: tech.accountStatus,
        lastMessage:  lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
        unreadCount,
      };
    })
  );

  // Sort: unread first, then by last message date, then alphabetical
  return result.sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    if (a.lastMessageAt && b.lastMessageAt)
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.fullName.localeCompare(b.fullName);
  });
}

const PLAN_BADGE: Record<string, string> = {
  FREE:     "bg-gray-100 text-gray-600",
  BEGINNER: "bg-blue-100 text-blue-700",
  PRO:      "bg-amber-100 text-amber-700",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   "bg-success-light text-success",
  PENDING:  "bg-amber-100 text-amber-700",
  DECLINED: "bg-danger-light text-danger",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const { q = "" } = await searchParams;

  const technicians = await getTechniciansWithLastMessage(session.userId);

  const filtered = q.trim()
    ? technicians.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q.toLowerCase()) ||
          t.phone.includes(q)
      )
    : technicians;

  const totalUnread = technicians.reduce((s, t) => s + t.unreadCount, 0);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
          Messages Techniciens
          {totalUnread > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-orange px-1.5 text-xs font-bold text-white">
              {totalUnread}
            </span>
          )}
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {technicians.length} technicien{technicians.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un technicien..."
          className="w-full rounded-2xl border border-line bg-surface pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-orange"
        />
      </form>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
          <Wrench size={32} className="text-muted" />
          <p className="text-sm font-semibold text-ink">
            {q ? "Aucun résultat" : "Aucun technicien enregistré"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line">
          {filtered.map((tech) => (
            <Link
              key={tech.userId}
              href={`/admin/messages/${tech.userId}`}
              className={`flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors ${
                tech.unreadCount > 0 ? "bg-brand-orange-light/10" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar
                  src={tech.avatarUrl}
                  name={tech.fullName}
                  size={46}
                />
                {tech.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                    {tech.unreadCount > 9 ? "9+" : tech.unreadCount}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className={`text-sm truncate ${
                    tech.unreadCount > 0
                      ? "font-bold text-ink"
                      : "font-semibold text-ink"
                  }`}>
                    {tech.fullName}
                  </p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    PLAN_BADGE[tech.planKey] ?? "bg-gray-100 text-gray-600"
                  }`}>
                    {tech.planName}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    STATUS_BADGE[tech.accountStatus] ?? "bg-gray-100 text-gray-500"
                  }`}>
                    {tech.accountStatus}
                  </span>
                </div>
                <p className={`text-xs truncate ${
                  tech.unreadCount > 0 ? "font-medium text-ink" : "text-muted"
                }`}>
                  {tech.lastMessage ?? (
                    <span className="italic text-muted">Aucun message — cliquez pour démarrer</span>
                  )}
                </p>
              </div>

              {/* Time */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                {tech.lastMessageAt && (
                  <span className="text-[10px] text-muted">
                    {formatRelativeTime(tech.lastMessageAt)}
                  </span>
                )}
                {tech.unreadCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-brand-orange" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}