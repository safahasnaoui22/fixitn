import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listSupportConversations } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  TECHNICIAN: "Technician",
  ADMIN: "Admin",
  SOUS_ADMIN: "Sous-Admin",
};

const ROLE_STYLE: Record<string, string> = {
  CLIENT: "bg-blue-50 text-blue-700",
  TECHNICIAN: "bg-brand-orange-light text-brand-orange-dark",
  ADMIN: "bg-brand-navy text-white",
  SOUS_ADMIN: "bg-purple-50 text-purple-700",
};

export default async function SousAdminSupportPage() {
  const session = await getSession();
  if (!session || session.role !== "SOUS_ADMIN") redirect("/login");

  const conversations = await listSupportConversations(session.userId);

  const unreadConversations = conversations.filter((c) => c.unreadCount > 0);
  const readConversations = conversations.filter((c) => c.unreadCount === 0);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Support Inbox
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {conversations.length} conversation
          {conversations.length !== 1 ? "s" : ""}
          {unreadConversations.length > 0 &&
            ` · ${unreadConversations.length} unread`}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
            <MessageCircle size={28} className="text-muted" />
          </div>
          <p className="font-heading text-base font-semibold text-ink">
            No support messages yet
          </p>
          <p className="text-sm text-muted max-w-xs">
            When clients or technicians contact support, their conversations
            will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Unread section */}
          {unreadConversations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Unread ({unreadConversations.length})
              </p>
              <div className="rounded-2xl border border-brand-orange/20 bg-surface overflow-hidden divide-y divide-line">
                {unreadConversations.map((conv) => (
                  <ConversationRow
                    key={conv.userId}
                    conv={conv}
                    roleLabel={ROLE_LABEL}
                    roleStyle={ROLE_STYLE}
                    unread
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read section */}
          {readConversations.length > 0 && (
            <div>
              {unreadConversations.length > 0 && (
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Earlier
                </p>
              )}
              <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line">
                {readConversations.map((conv) => (
                  <ConversationRow
                    key={conv.userId}
                    conv={conv}
                    roleLabel={ROLE_LABEL}
                    roleStyle={ROLE_STYLE}
                    unread={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="rounded-2xl border border-line bg-surface-alt px-4 py-3">
        <div className="flex items-start gap-2">
          <Search size={14} className="text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            Clients and technicians can contact support from their profile
            page. Click any conversation to open the chat and reply.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  conv,
  roleLabel,
  roleStyle,
  unread,
}: {
  conv: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
  };
  roleLabel: Record<string, string>;
  roleStyle: Record<string, string>;
  unread: boolean;
}) {
  return (
    <Link
      href={`/sous-admin/support/${conv.userId}`}
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-alt ${
        unread ? "bg-brand-orange-light/20" : ""
      }`}
    >
      {/* Avatar with unread dot */}
      <div className="relative shrink-0">
        <Avatar src={conv.avatarUrl} name={conv.fullName} size={44} />
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className={`text-sm truncate ${
              unread ? "font-bold text-ink" : "font-semibold text-ink"
            }`}
          >
            {conv.fullName}
          </p>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              roleStyle[conv.role] ?? "bg-surface-alt text-muted"
            }`}
          >
            {roleLabel[conv.role] ?? conv.role}
          </span>
        </div>
        <p
          className={`text-xs truncate ${
            unread ? "font-medium text-ink" : "text-muted"
          }`}
        >
          {conv.lastMessage}
        </p>
      </div>

      {/* Time */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] text-muted">
          {formatRelativeTime(conv.lastMessageAt)}
        </span>
        {unread && (
          <span className="h-2 w-2 rounded-full bg-brand-orange" />
        )}
      </div>
    </Link>
  );
}