import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { findUserById } from "@/lib/db/users";
import { listSupportMessages, markMessagesRead } from "@/lib/db/supportChat";
import { areBothActiveSeniors } from "@/lib/db/seniorChat";
import { Avatar } from "@/components/ui/Avatar";
import { TechBottomNav } from "@/components/TechBottomNav";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { TechChatPane } from "./TechChatPane";

const ROLE_LABEL: Record<string, string> = {
  ADMIN:      "Administrateur",
  SOUS_ADMIN: "Support Fixili",
  CLIENT:     "Client",
  TECHNICIAN: "Technicien Senior",
};

export default async function TechMessageChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const session    = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const { userId } = await params;
  const otherUser  = await findUserById(userId);
  if (!otherUser) notFound();

  // Technician <-> technician private chat is only for Senior technicians.
  if (otherUser.role === "TECHNICIAN" && !(await areBothActiveSeniors(session.userId, userId))) {
    notFound();
  }
  const { from } = await searchParams;
  const backHref = otherUser.role === "TECHNICIAN" || from === "senior" ? "/t/senior" : "/t/messages";

  await markMessagesRead(session.userId, userId);
  const messages = await listSupportMessages(session.userId, userId);

  return (
    <>
      <div
        className="app-content flex flex-col"
        style={{ paddingBottom: "80px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 shrink-0 bg-surface">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <Avatar
            src={otherUser.avatarUrl}
            name={otherUser.fullName}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading text-sm font-semibold text-ink truncate">
                {otherUser.fullName}
              </p>
              {["ADMIN", "SOUS_ADMIN"].includes(otherUser.role) && (
                <ShieldCheck size={14} className="text-brand-orange shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted">
              {ROLE_LABEL[otherUser.role] ?? otherUser.role}
            </p>
          </div>
        </div>

        {/* Chat pane */}
        <Suspense fallback={null}>
          <TechChatPane
            myId={session.userId}
            otherUserId={userId}
            otherUserName={otherUser.fullName}
            otherUserAvatar={otherUser.avatarUrl}
            initialMessages={messages}
          />
        </Suspense>
      </div>
      <TechBottomNav />
    </>
  );
}