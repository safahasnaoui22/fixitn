import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { findUserById } from "@/lib/db/users";
import { listSupportMessages, markMessagesRead } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { ReportUserButton } from "@/components/ReportUserButton";
import { DirectChatPane } from "./DirectChatPane";

export default async function ClientDirectChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole("CLIENT");
  const { userId } = await params;
  const other = await findUserById(userId);
  if (!other || other.role !== "TECHNICIAN") notFound();

  await markMessagesRead(session.userId, userId);
  const messages = await listSupportMessages(session.userId, userId);

  return (
    <div className="app-content flex flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 shrink-0 bg-surface">
        <Link href="/chats" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <Avatar src={other.avatarUrl} name={other.fullName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-ink truncate">{other.fullName}</p>
          <p className="text-xs text-muted">Technician</p>
        </div>
        <ReportUserButton reportedUserId={other.id} reportedName={other.fullName} />
      </div>
      <DirectChatPane
        myId={session.userId}
        otherUserId={userId}
        otherUserName={other.fullName}
        otherUserAvatar={other.avatarUrl}
        initialMessages={messages}
      />
    </div>
  );
}
