import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listSupportConversations } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  TECHNICIAN: "Technicien",
  ADMIN: "Admin",
  SOUS_ADMIN: "Sous-Admin",
};

const ROLE_STYLE: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  TECHNICIAN: "bg-orange-100 text-orange-700",
};

export default async function AdminSupportPage() {
  const session = await requireRole("ADMIN");

  const conversations = await listSupportConversations(session.userId);
  const unread = conversations.filter(c => c.unreadCount > 0);
  const read = conversations.filter(c => c.unreadCount === 0);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Support — Messagerie
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          {unread.length > 0 && ` · ${unread.length} non lue${unread.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-20 text-center">
          <MessageCircle size={32} className="text-muted" />
          <p className="font-semibold text-ink">Aucun message pour le moment</p>
          <p className="text-sm text-muted">
            Les clients et techniciens vous contacteront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {unread.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Non lus ({unread.length})
              </p>
              <div className="rounded-2xl border border-brand-orange/20 bg-surface overflow-hidden divide-y divide-line">
                {unread.map(conv => (
                  <ConvRow key={conv.userId} conv={conv} roleLabel={ROLE_LABEL} roleStyle={ROLE_STYLE} />
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              {unread.length > 0 && (
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Lus
                </p>
              )}
              <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line">
                {read.map(conv => (
                  <ConvRow key={conv.userId} conv={conv} roleLabel={ROLE_LABEL} roleStyle={ROLE_STYLE} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConvRow({
  conv, roleLabel, roleStyle,
}: {
  conv: {
    userId: string; fullName: string; avatarUrl: string | null;
    role: string; lastMessage: string; lastMessageAt: string; unreadCount: number;
  };
  roleLabel: Record<string, string>;
  roleStyle: Record<string, string>;
}) {
  return (
    <Link
      href={`/admin/support/${conv.userId}`}
      className={`flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors ${
        conv.unreadCount > 0 ? "bg-brand-orange-light/10" : ""
      }`}
    >
      <div className="relative shrink-0">
        <Avatar src={conv.avatarUrl} name={conv.fullName} size={44} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-ink" : "font-semibold text-ink"}`}>
            {conv.fullName}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            roleStyle[conv.role] ?? "bg-surface-alt text-muted"
          }`}>
            {roleLabel[conv.role] ?? conv.role}
          </span>
        </div>
        <p className={`text-xs truncate ${conv.unreadCount > 0 ? "font-medium text-ink" : "text-muted"}`}>
          {conv.lastMessage}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] text-muted">{formatRelativeTime(conv.lastMessageAt)}</span>
        {conv.unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-brand-orange" />}
      </div>
    </Link>
  );
}