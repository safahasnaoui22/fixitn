import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestById, listMessages } from "@/lib/db/requests";
import { Avatar } from "@/components/ui/Avatar";
import { ChatPane } from "./ChatPane";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const req = await getRequestById(id);
  if (!req) notFound();

  const isClient = session.userId === req.clientId;
  const isTechnician = session.userId === req.technicianUserId;
  if (!isClient && !isTechnician) redirect("/");

  const messages = await listMessages(id);

  const otherName = isClient ? req.technicianFullName : req.clientFullName;
  const otherAvatar = isClient ? req.technicianAvatarUrl : req.clientAvatarUrl;

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4 shrink-0">
        <Link
          href={`/requests/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <Avatar src={otherAvatar} name={otherName} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-ink">{otherName}</p>
          <p className="text-xs text-muted">{req.categoryName}</p>
        </div>
      </div>

      <ChatPane requestId={id} messages={messages} currentUserId={session.userId} />
    </div>
  );
}