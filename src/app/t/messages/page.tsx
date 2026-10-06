import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/client";
import { Avatar } from "@/components/ui/Avatar";
import { TechBottomNav } from "@/components/TechBottomNav";
import { formatRelativeTime } from "@/lib/utils";

async function getContacts(techUserId: string, technicianId: string) {
  // 1. Admin + Sous-admin contacts
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SOUS_ADMIN"] } },
    select: { id: true, fullName: true, avatarUrl: true, role: true },
  });

  // 2. Clients who have booked this technician
  const requests = await prisma.serviceRequest.findMany({
    where: { technicianId },
    distinct: ["clientId"],
    include: {
      client: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clientUsers = requests.map((r) => ({
    id:        r.client.id,
    fullName:  r.client.fullName,
    avatarUrl: r.client.avatarUrl,
    role:      "CLIENT" as const,
  }));

  // Merge all contacts (staff first, then clients)
  const allContacts = [
    ...staffUsers.map((u) => ({ ...u, role: u.role as string })),
    ...clientUsers,
  ];

  // Get last message + unread count for each contact
  const result = await Promise.all(
    allContacts.map(async (contact) => {
      const lastMessage = await prisma.supportMessage.findFirst({
        where: {
          OR: [
            { fromUserId: techUserId,    toUserId: contact.id },
            { fromUserId: contact.id,    toUserId: techUserId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await prisma.supportMessage.count({
        where: {
          fromUserId: contact.id,
          toUserId:   techUserId,
          read:       false,
        },
      });

      return {
        ...contact,
        lastMessage:   lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
        unreadCount,
      };
    })
  );

  return result.sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    if (a.lastMessageAt && b.lastMessageAt)
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return 0;
  });
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN:      "Administrateur",
  SOUS_ADMIN: "Support",
  CLIENT:     "Client",
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN:      "bg-brand-navy text-white",
  SOUS_ADMIN: "bg-purple-100 text-purple-700",
  CLIENT:     "bg-blue-100 text-blue-700",
};

export default async function TechMessagesPage() {
  const session    = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const contacts = await getContacts(session.userId, technician.id);
  const totalUnread = contacts.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-semibold text-ink">
              Messages
            </p>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Contacts list */}
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
              <MessageCircle size={28} className="text-muted" />
            </div>
            <p className="font-heading text-base font-semibold text-ink">
              Aucune conversation
            </p>
            <p className="text-sm text-muted">
              Vos contacts apparaîtront ici une fois que des clients
              vous auront réservé ou que l'admin vous aura écrit.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/t/messages/${contact.id}`}
                className={`flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors ${
                  contact.unreadCount > 0 ? "bg-brand-orange-light/10" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={contact.avatarUrl}
                    name={contact.fullName}
                    size={46}
                  />
                  {contact.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                      {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm truncate ${
                      contact.unreadCount > 0
                        ? "font-bold text-ink"
                        : "font-semibold text-ink"
                    }`}>
                      {contact.fullName}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      ROLE_STYLE[contact.role] ?? "bg-surface-alt text-muted"
                    }`}>
                      {ROLE_LABEL[contact.role] ?? contact.role}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${
                    contact.unreadCount > 0
                      ? "font-medium text-ink"
                      : "text-muted"
                  }`}>
                    {contact.lastMessage ?? (
                      <span className="italic">Démarrer la conversation</span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {contact.lastMessageAt && (
                    <span className="text-[10px] text-muted">
                      {formatRelativeTime(contact.lastMessageAt)}
                    </span>
                  )}
                  {contact.unreadCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-brand-orange" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <TechBottomNav />
    </>
  );
}