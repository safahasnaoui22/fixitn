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
import { getT } from "@/lib/i18n/server";
import { panelLogout } from "./logout";
import type { PermissionKey } from "@/lib/permissions";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "admin.nav.users", icon: Users },
  { href: "/admin/technicians", label: "admin.nav.technicians", icon: Wrench },
  { href: "/admin/support", label: "admin.nav.support", icon: MessageCircle },
  { href: "/admin/complaints", label: "admin.nav.complaints", icon: Flag },
  { href: "/admin/messages", label: "admin.nav.messages", icon: MessageCircle },
  { href: "/admin/requests", label: "admin.nav.requests", icon: ClipboardList },
  { href: "/admin/revenue", label: "admin.nav.revenue", icon: TrendingUp },
  { href: "/admin/payments", label: "admin.nav.payments", icon: CreditCard },
  { href: "/admin/plans", label: "admin.nav.plans", icon: Star },
  { href: "/admin/plan-config", label: "admin.nav.planConfig", icon: Settings2 },
  { href: "/admin/categories", label: "admin.nav.categories", icon: Layers },
  { href: "/admin/create-account", label: "admin.nav.createAccount", icon: UserPlus },
  { href: "/admin/team", label: "admin.nav.team", icon: ShieldCheck },
  { href: "/admin/activity", label: "admin.nav.activity", icon: History },
  { href: "/admin/security", label: "admin.nav.security", icon: ShieldAlert },
  { href: "/admin/quality", label: "admin.nav.quality", icon: Gauge },
  { href: "/admin/subscriptions", label: "admin.nav.planAlerts", icon: CalendarClock },
  { href: "/admin/broadcast", label: "admin.nav.broadcast", icon: Megaphone },
  { href: "/admin/reports", label: "admin.nav.reports", icon: BarChart3 },
];

// What a sous-admin sees: his own home + only the functions the admin allowed.
const SOUS_NAV: Record<PermissionKey, Item> = {
  technicians: { href: "/sous-admin/technicians", label: "admin.nav.technicians", icon: Wrench },
  support: { href: "/sous-admin/support", label: "admin.nav.support", icon: MessageCircle, badge: true },
  complaints: { href: "/admin/complaints", label: "admin.nav.complaints", icon: Flag },
  users: { href: "/admin/users", label: "admin.nav.users", icon: Users },
  requests: { href: "/admin/requests", label: "admin.nav.requests", icon: ClipboardList },
  categories: { href: "/admin/categories", label: "admin.nav.categories", icon: Layers },
  plans: { href: "/admin/plans", label: "admin.nav.plans", icon: Star },
  payments: { href: "/admin/payments", label: "admin.nav.payments", icon: CreditCard },
  revenue: { href: "/admin/revenue", label: "admin.nav.revenue", icon: TrendingUp },
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

export async function AdminSidebar({
  role,
  permissions = [],
  unreadCount = 0,
}: {
  role: "ADMIN" | "SOUS_ADMIN";
  permissions?: string[];
  unreadCount?: number;
}) {
  const t = await getT();
  const items: Item[] =
    role === "ADMIN"
      ? ADMIN_NAV
      : [
          { href: "/sous-admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
          ...SOUS_ORDER.filter((k) => permissions.includes(k)).map((k) => SOUS_NAV[k]),
        ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo (extra top margin on phones so it does not touch the close button) */}
      <div className="mt-8 shrink-0 px-5 py-6 lg:mt-0">
        <p className="font-heading text-lg font-bold text-white">FixiTN</p>
        <p className="text-xs text-white/50">
          {role === "ADMIN" ? t("admin.shell.adminPanel") : t("admin.shell.sousPanel")}
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
            <span className="flex-1 truncate">{t(label)}</span>
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
          <span>{t("admin.nav.logout")}</span>
        </button>
      </form>
    </div>
  );
}
