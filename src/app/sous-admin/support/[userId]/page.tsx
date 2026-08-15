import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/db/users";
import {
  listSupportMessages,
  markMessagesRead,
} from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { SupportChatPane } from "./SupportChatPane";

export default async function SousAdminSupportChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "SOUS_ADMIN") redirect("/login");

  const { userId } = await params;

  const otherUser = await findUserById(userId);
  if (!otherUser) notFound();

  // Mark messages from this user as read
  await markMessagesRead(session.userId, userId);

  const messages = await listSupportMessages(session.userId, userId);

  const ROLE_LABEL: Record<string, string> = {
    CLIENT: "Client",
    TECHNICIAN: "Technician",
    ADMIN: "Admin",
    SOUS_ADMIN: "Sous-Admin",
  };

  return (
    <div className="flex flex-col h-full max-w-2xl" style={{ height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 shrink-0 bg-surface rounded-t-2xl">
        <Link
          href="/sous-admin/support"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <Avatar src={otherUser.avatarUrl} name={otherUser.fullName} size={38} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-ink truncate">
            {otherUser.fullName}
          </p>
          <p className="text-xs text-muted">
            {ROLE_LABEL[otherUser.role] ?? otherUser.role} · {otherUser.phone}
          </p>
        </div>
      </div>

      {/* Chat pane */}
      <Suspense fallback={null}>
        <SupportChatPane
          sousAdminId={session.userId}
          otherUserId={userId}
          otherUserName={otherUser.fullName}
          initialMessages={messages}
        />
      </Suspense>
    </div>
  );
}