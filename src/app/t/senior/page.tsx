import Link from "next/link";
import { ArrowLeft, Lock, MessageCircle, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { TechBottomNav } from "@/components/TechBottomNav";
import { formatRelativeTime } from "@/lib/utils";
import {
  countSeniorMembers,
  isActiveSenior,
  listSeniorContacts,
  seniorUnreadCount,
} from "@/lib/db/seniorChat";

export const dynamic = "force-dynamic";

/**
 * Cercle Senior: the Senior technicians are listed by name. Pick one to talk with
 * him privately, or open the group chat with everybody.
 */
export default async function SeniorCirclePage() {
  const session = await requireRole("TECHNICIAN");
  const allowed = await isActiveSenior(session.userId);

  if (!allowed) {
    return (
      <>
        <div className="app-content no-scrollbar flex flex-col items-center gap-3 px-8 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
            <Lock size={28} className="text-muted" />
          </div>
          <p className="font-heading text-lg font-semibold text-ink">Cercle Senior</p>
          <p className="text-sm text-muted">
            Ce groupe est réservé aux techniciens avec le badge Senior Pro. Il leur permet de
            s&apos;entraider en cas de problème.
          </p>
          <Link href="/t/messages" className="mt-2 text-sm font-semibold text-brand-orange">
            Retour aux messages
          </Link>
        </div>
        <TechBottomNav />
      </>
    );
  }

  const [contacts, members, groupUnread] = await Promise.all([
    listSeniorContacts(session.userId),
    countSeniorMembers(),
    seniorUnreadCount(session.userId),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Link
            href="/t/messages"
            aria-label="Retour"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-ink"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-heading text-base font-semibold text-ink">Cercle Senior</p>
            <p className="text-xs text-muted">Choisissez avec qui discuter</p>
          </div>
        </div>

        <Link
          href="/t/senior/group"
          className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-brand-orange/30 bg-brand-orange-light px-4 py-3.5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Groupe de tous les Seniors</p>
            <p className="text-xs text-muted">{members} technicien{members > 1 ? "s" : ""} Senior</p>
          </div>
          {groupUnread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
              {groupUnread}
            </span>
          )}
        </Link>

        <p className="px-5 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted">
          Techniciens Senior
        </p>

        {contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt">
              <MessageCircle size={24} className="text-muted" />
            </div>
            <p className="text-sm text-muted">Pas encore d&apos;autre technicien Senior.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {contacts.map((c) => (
              <Link
                key={c.userId}
                href={`/t/messages/${c.userId}?from=senior`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-alt"
              >
                <Avatar src={c.avatarUrl} name={c.fullName} size={46} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm text-ink ${c.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
                    {c.fullName}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.lastMessage ?? <span className="italic">{c.title} · Démarrer la conversation</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {c.lastMessageAt && (
                    <span className="text-[10px] text-muted">{formatRelativeTime(c.lastMessageAt)}</span>
                  )}
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
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
