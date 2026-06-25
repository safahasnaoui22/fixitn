import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPublicUserById } from "@/lib/db/users";
import { Avatar } from "@/components/ui/Avatar";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { logoutAction } from "./actions";

export default async function ProfilePage() {
  const session = await requireUser();
  if (session.role === "TECHNICIAN") redirect("/t/profile");

  const user = await getPublicUserById(session.userId);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <p className="font-heading text-lg font-bold mb-4">My Profile</p>
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={64} />
            <div>
              <p className="font-heading text-lg font-semibold">{user?.fullName}</p>
              <p className="text-sm text-white/60">{user?.phone}</p>
              {user?.city && <p className="text-sm text-white/60">{user.city}</p>}
            </div>
          </div>
        </div>

        <div className="px-5 py-6 flex flex-col gap-4">
          <Section title="Activity">
            <MenuItem href="/requests" icon={ClipboardList} label="My Bookings" />
            <MenuItem href="/chats" icon={MessageCircle} label="Messages" />
            <MenuItem href="/notifications" icon={Bell} label="Notifications" />
          </Section>

          <Section title="Support">
            <MenuItem href="#" icon={Settings} label="Settings" />
            <MenuItem href="#" icon={HelpCircle} label="Help & Support" />
          </Section>

          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl border border-danger-light bg-danger-light px-4 py-3.5 text-sm font-semibold text-danger"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </form>
        </div>
      </div>
      <ClientBottomNav />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof ClipboardList;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-alt"
    >
      <Icon size={18} className="text-muted shrink-0" />
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <ChevronRight size={16} className="text-muted" />
    </Link>
  );
}