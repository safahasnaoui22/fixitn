import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { getSession, destroySession } from "@/lib/auth";
import { getUnreadSupportCount } from "@/lib/db/supportChat";

const NAV = [
  {
    href: "/sous-admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/sous-admin/technicians",
    label: "Technicians",
    icon: Wrench,
  },
  {
    href: "/sous-admin/support",
    label: "Support",
    icon: MessageCircle,
    badge: true,
  },
];

async function sousAdminLogout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function SousAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SOUS_ADMIN") redirect("/");

  const unreadCount = await getUnreadSupportCount(session.userId);

  return (
    <div className="flex h-screen bg-surface-alt overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-brand-navy">
        <div className="px-5 py-6">
          <p className="font-heading text-lg font-bold text-white">FixiTN</p>
          <p className="text-xs text-white/50">Sous-Admin Panel</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <form action={sousAdminLogout} className="p-3 shrink-0">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </form>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}