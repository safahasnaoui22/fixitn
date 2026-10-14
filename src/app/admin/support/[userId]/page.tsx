import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { findUserById } from "@/lib/db/users";
import { listSupportMessages, markMessagesRead } from "@/lib/db/supportChat";
import { Avatar } from "@/components/ui/Avatar";
import { AdminSupportChatPane } from "./AdminSupportChatPane";

export default async function AdminSupportChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole("ADMIN");
  const { userId } = await params;

  const otherUser = await findUserById(userId);
  if (!otherUser) notFound();

  await markMessagesRead(session.userId, userId);
  const messages = await listSupportMessages(session.userId, userId);

  const ROLE_LABEL: Record<string, string> = {
    CLIENT: "Client",
    TECHNICIAN: "Technicien",
    SOUS_ADMIN: "Sous-Admin",
  };

  return (
    <div className="flex flex-col max-w-2xl" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex items-center gap-3 border-b border-line pb-4 mb-0 shrink-0">
        <Link
          href="/admin/support"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt border border-line"
        >
          <ArrowLeft size={18} />
        </Link>
        <Avatar src={otherUser.avatarUrl} name={otherUser.fullName} size={38} />
        <div>
          <p className="font-heading text-sm font-semibold text-ink">
            {otherUser.fullName}
          </p>
          <p className="text-xs text-muted">
            {ROLE_LABEL[otherUser.role] ?? otherUser.role} · {otherUser.phone}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <AdminSupportChatPane
          adminId={session.userId}
          otherUserId={userId}
          otherUserName={otherUser.fullName}
          initialMessages={messages}
        />
      </Suspense>
    </div>
  );
}