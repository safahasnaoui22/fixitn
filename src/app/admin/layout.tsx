import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, Wrench, ClipboardList, TrendingUp, LogOut } from "lucide-react";
import { requireRole, destroySession } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/technicians", label: "Technicians", icon: Wrench },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
];

async function adminLogout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="flex h-screen bg-surface-alt overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-brand-navy">
        <div className="px-5 py-6">
          <p className="font-heading text-lg font-bold text-white">FixiTN</p>
          <p className="text-xs text-white/50">Admin Panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <form action={adminLogout} className="p-3">
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut size={18} />
            Log Out
          </button>
        </form>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}