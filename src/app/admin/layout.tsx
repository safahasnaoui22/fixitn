import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  TrendingUp,
  CreditCard,
  Star,
  LogOut,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { requireRole, destroySession } from "@/lib/auth";
import { AdminShell } from "./AdminShell";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/technicians",
    label: "Technicians",
    icon: Wrench,
  },
  // Add to the NAV array:
{ href: "/admin/support", label: "Support", icon: MessageCircle },
  {
    href: "/admin/requests",
    label: "Requests",
    icon: ClipboardList,
  },
  {
    href: "/admin/revenue",
    label: "Revenue",
    icon: TrendingUp,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: Star,
  },
  {
    href: "/admin/plan-config",
    label: "Plan Config",
    icon: Star,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/create-account",
    label: "Create Account",
    icon: UserPlus,
  },
];

async function adminLogout() {
  "use server";

  await destroySession();
  redirect("/login");
}

function Sidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo */}
      <div className="mt-8 shrink-0 px-5 py-6 lg:mt-0">
        <p className="font-heading text-lg font-bold text-white">
          FixiTN
        </p>

        <p className="text-xs text-white/50">
          Admin Panel
        </p>
      </div>

      {/* Nav links — scrollable if too many */}
      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon
              size={16}
              className="shrink-0"
            />

            <span className="truncate">
              {label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Logout — always pinned to bottom */}
      <form
        action={adminLogout}
        className="shrink-0 border-t border-white/10 p-3"
      >
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut
            size={16}
            className="shrink-0"
          />

          <span>
            Log Out
          </span>
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