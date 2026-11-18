"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Wrench, LayoutGrid,
  ClipboardList, CreditCard, BadgeDollarSign,
  RefreshCcw, Globe, UserPlus,
} from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

const MANAGEMENT_ITEMS = [
  { label: "admin.nav.users",          icon: Users,            href: "/admin/users" },
  { label: "admin.nav.technicians",    icon: Wrench,            href: "/admin/technicians" },
  { label: "admin.nav.categories",     icon: LayoutGrid,        href: "/admin/categories" },
  { label: "admin.dashNav.jobsRequests",  icon: ClipboardList,     href: "/admin/requests" },
];

const FINANCIAL_ITEMS = [
  { label: "admin.nav.payments",       icon: CreditCard,        href: "/admin/payments" },
  { label: "admin.nav.revenue",        icon: BadgeDollarSign,   href: "/admin/revenue" },
  { label: "admin.nav.plans",          icon: RefreshCcw,        href: "/admin/plans" },
  { label: "admin.nav.planConfig",    icon: RefreshCcw,        href: "/admin/plan-config" },
];

const ADMIN_ITEMS = [
  { label: "admin.nav.createAccount", icon: UserPlus,          href: "/admin/create-account" },
];

function NavSection({
  title,
  items,
  pathname,
  t,
}: {
  title: string;
  items: { label: string; icon: React.ElementType; href: string }[];
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--sidebar-text)] opacity-60">
        {title}
      </p>
      {items.map(({ label, icon: Icon, href }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
              active
                ? "bg-[color:var(--sidebar-hover)] text-white"
                : "text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover)] hover:text-white"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{t(label)}</span>
          </Link>
        );
      })}
    </div>
  );
}

interface NavbarProps {
  activeItem?: string;
  onSelect?: (label: string) => void;
}

const Navbar: React.FC<NavbarProps> = () => {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="flex flex-col h-full">
      {/* Dashboard */}
      <div className="px-3 mb-2">
        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/admin"
              ? "bg-brand-orange text-white"
              : "text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover)] hover:text-white"
          }`}
        >
          <LayoutDashboard size={16} className="shrink-0" />
          <span>{t("admin.nav.dashboard")}</span>
        </Link>
      </div>

      {/* Scrollable sections */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3">
        <NavSection title={t("admin.dashNav.management")} items={MANAGEMENT_ITEMS} pathname={pathname} t={t} />
        <NavSection title={t("admin.dashNav.financial")} items={FINANCIAL_ITEMS} pathname={pathname} t={t} />
        <NavSection title={t("admin.dashNav.admin")} items={ADMIN_ITEMS} pathname={pathname} t={t} />
      </nav>

      {/* Footer */}
      <div className="p-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover)] hover:text-white transition-colors"
        >
          <Globe size={15} />
          <span>{t("admin.dashNav.viewWebsite")}</span>
        </Link>
      </div>
    </aside>
  );
};

export default Navbar;