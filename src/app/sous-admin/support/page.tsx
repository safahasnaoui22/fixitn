import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { listSupportConversations } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  TECHNICIAN: "Technicien",
  ADMIN: "Admin",
  SOUS_ADMIN: "Sous-admin",
};

const ROLE_STYLE: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  TECHNICIAN: "bg-orange-100 text-orange-700",
};

export default async function SousAdminSupportPage() {
  const session = await requirePermission("support");
  const conversations = await listSupportConversations(session.userId);
  const unread = conversations.filter((conversation) => conversation.unreadCount > 0);
  const read = conversations.filter((conversation) => conversation.unreadCount === 0);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Support — Messagerie</h1>
        <p className="mt-0.5 text-sm text-muted">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          {unread.length > 0 && ` · ${unread.length} non lue${unread.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-20 text-center">
          <MessageCircle size={32} className="text-muted" />
          <p className="font-semibold text-ink">Aucun message pour le moment</p>
          <p className="max-w-sm text-sm text-muted">
            Les messages envoyés par les clients et les techniciens apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {unread.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                Non lus ({unread.length})
              </p>
              <div className="overflow-hidden rounded-2xl border border-brand-orange/20 bg-surface divide-y divide-line">
                {unread.map((conversation) => <ConversationRow key={conversation.userId} conversation={conversation} />)}
              </div>
            </section>
          )}
          {read.length > 0 && (
            <section>
              {unread.length > 0 && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Lus</p>}
              <div className="overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
                {read.map((conversation) => <ConversationRow key={conversation.userId} conversation={conversation} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: {
  userId: string; fullName: string; avatarUrl: string | null; role: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number;
} }) {
  return (
    <Link
      href={`/sous-admin/support/${conversation.userId}`}
      className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-alt ${conversation.unreadCount > 0 ? "bg-brand-orange-light/10" : ""}`}
    >
      <div className="relative shrink-0">
        <Avatar src={conversation.avatarUrl} name={conversation.fullName} size={44} />
        {conversation.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className={`truncate text-sm text-ink ${conversation.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
            {conversation.fullName}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_STYLE[conversation.role] ?? "bg-surface-alt text-muted"}`}>
            {ROLE_LABEL[conversation.role] ?? conversation.role}
          </span>
        </div>
        <p className={`truncate text-xs ${conversation.unreadCount > 0 ? "font-medium text-ink" : "text-muted"}`}>
          {conversation.lastMessage}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-muted">{formatRelativeTime(conversation.lastMessageAt)}</span>
        {conversation.unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-brand-orange" />}
      </div>
    </Link>
  );
}
