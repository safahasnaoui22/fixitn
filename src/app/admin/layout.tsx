import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, Users, Wrench, ClipboardList,
  TrendingUp, CreditCard, Star, LogOut, UserPlus,
} from "lucide-react";
import { requireRole, destroySession } from "@/lib/auth";
import { AdminShell } from "./AdminShell";

const NAV = [
  { href: "/admin",                 label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/users",           label: "Users",         icon: Users },
  { href: "/admin/technicians",     label: "Technicians",   icon: Wrench },
  { href: "/admin/requests",        label: "Requests",      icon: ClipboardList },
  { href: "/admin/revenue",         label: "Revenue",       icon: TrendingUp },
  { href: "/admin/payments",        label: "Payments",      icon: CreditCard },
  { href: "/admin/plans",           label: "Plans",         icon: Star },
  { href: "/admin/plan-config",     label: "Plan Config",   icon: Star },
  { href: "/admin/categories",      label: "Categories",    icon: LayoutDashboard },
  { href: "/admin/create-account",  label: "Create Account",icon: UserPlus },
];

async function adminLogout() {
  "use server";
  await destroySession();
  redirect("/login");
}

function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 mt-8 lg:mt-0 shrink-0">
        <p className="font-heading text-lg font-bold text-white">FixiTN</p>
        <p className="text-xs text-white/50">Admin Panel</p>
      </div>

      {/* Nav links — scrollable if too many */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout — always pinned to bottom */}
      <form action={adminLogout} className="p-3 shrink-0 border-t border-white/10">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </form>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return (
    <AdminShell sidebar={<Sidebar />}>
      {children}
    </AdminShell>
  );
}