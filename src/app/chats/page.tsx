import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listChatsForUser } from "@/lib/db/requests";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/ui/Card";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { formatRelativeTime } from "@/lib/utils";

export default async function ChatsPage() {
  const session = await requireUser();
  const chats = await listChatsForUser(session.userId);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-semibold text-ink">Messages</p>
        </div>

        {chats.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Chat with a technician once they accept your request."
          />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {chats.map((chat) => {
              const isClient = session.userId === chat.clientId;
              const otherName = isClient ? chat.technicianFullName : chat.clientFullName;
              const otherAvatar = isClient ? chat.technicianAvatarUrl : chat.clientAvatarUrl;

              return (
                <Link
                  key={chat.requestId}
                  href={`/requests/${chat.requestId}/chat`}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-alt active:bg-surface-alt"
                >
                  <div className="relative">
                    <Avatar src={otherAvatar} name={otherName} size={48} />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <CategoryIcon
                        icon={chat.categoryIcon}
                        color={chat.categoryColor}
                        size={10}
                        badgeSize={20}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-heading text-sm font-semibold text-ink">
                        {otherName}
                      </p>
                      {chat.lastMsgAt && (
                        <span className="shrink-0 text-[11px] text-muted">
                          {formatRelativeTime(chat.lastMsgAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted mt-0.5">{chat.categoryName}</p>
                    {chat.lastMsg && (
                      <p className="truncate text-sm text-muted mt-0.5">{chat.lastMsg}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <ClientBottomNav />
    </>
  );
}