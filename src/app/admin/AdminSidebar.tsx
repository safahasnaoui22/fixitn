import Link from "next/link";
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
  ShieldCheck,
  History,
  Settings2,
  Layers,
  ShieldAlert,
  Flag,
  Gauge,
  CalendarClock,
  Megaphone,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { panelLogout } from "./logout";
import type { PermissionKey } from "@/lib/permissions";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/technicians", label: "Technicians", icon: Wrench },
  { href: "/admin/support", label: "Support", icon: MessageCircle },
  { href: "/admin/complaints", label: "Complaints", icon: Flag },
  { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/plans", label: "Plans", icon: Star },
  { href: "/admin/plan-config", label: "Plan Config", icon: Settings2 },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/create-account", label: "Create Account", icon: UserPlus },
  { href: "/admin/team", label: "Team & Access", icon: ShieldCheck },
  { href: "/admin/activity", label: "Activity", icon: History },
  { href: "/admin/security", label: "Security", icon: ShieldAlert },
  { href: "/admin/quality", label: "Quality", icon: Gauge },
  { href: "/admin/subscriptions", label: "Plan alerts", icon: CalendarClock },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

// What a sous-admin sees: his own home + only the functions the admin allowed.
const SOUS_NAV: Record<PermissionKey, Item> = {
  technicians: { href: "/sous-admin/technicians", label: "Technicians", icon: Wrench },
  support: { href: "/sous-admin/support", label: "Support", icon: MessageCircle, badge: true },
  complaints: { href: "/admin/complaints", label: "Complaints", icon: Flag },
  users: { href: "/admin/users", label: "Users", icon: Users },
  requests: { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  categories: { href: "/admin/categories", label: "Categories", icon: Layers },
  plans: { href: "/admin/plans", label: "Plans", icon: Star },
  payments: { href: "/admin/payments", label: "Payments", icon: CreditCard },
  revenue: { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
};

const SOUS_ORDER: PermissionKey[] = [
  "technicians",
  "support",
  "users",
  "requests",
  "categories",
  "plans",
  "payments",
  "revenue",
];

export function AdminSidebar({
  role,
  permissions = [],
  unreadCount = 0,
}: {
  role: "ADMIN" | "SOUS_ADMIN";
  permissions?: string[];
  unreadCount?: number;
}) {
  const items: Item[] =
    role === "ADMIN"
      ? ADMIN_NAV
      : [
          { href: "/sous-admin", label: "Dashboard", icon: LayoutDashboard },
          ...SOUS_ORDER.filter((k) => permissions.includes(k)).map((k) => SOUS_NAV[k]),
        ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo (extra top margin on phones so it does not touch the close button) */}
      <div className="mt-8 shrink-0 px-5 py-6 lg:mt-0">
        <p className="font-heading text-lg font-bold text-white">FixiTN</p>
        <p className="text-xs text-white/50">
          {role === "ADMIN" ? "Admin Panel" : "Sous-Admin Panel"}
        </p>
      </div>

      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {items.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <form action={panelLogout} className="shrink-0 border-t border-white/10 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Log Out</span>
        </button>
      </form>
    </div>
  );
}
