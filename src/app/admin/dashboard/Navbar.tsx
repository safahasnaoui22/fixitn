"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Wrench, LayoutGrid,
  ClipboardList, CreditCard, BadgeDollarSign,
  RefreshCcw, Globe, UserPlus,
} from "lucide-react";

const MANAGEMENT_ITEMS = [
  { label: "Users",          icon: Users,            href: "/admin/users" },
  { label: "Technicians",    icon: Wrench,            href: "/admin/technicians" },
  { label: "Categories",     icon: LayoutGrid,        href: "/admin/categories" },
  { label: "Jobs/Requests",  icon: ClipboardList,     href: "/admin/requests" },
];

const FINANCIAL_ITEMS = [
  { label: "Payments",       icon: CreditCard,        href: "/admin/payments" },
  { label: "Revenue",        icon: BadgeDollarSign,   href: "/admin/revenue" },
  { label: "Plans",          icon: RefreshCcw,        href: "/admin/plans" },
  { label: "Plan Config",    icon: RefreshCcw,        href: "/admin/plan-config" },
];

const ADMIN_ITEMS = [
  { label: "Create Account", icon: UserPlus,          href: "/admin/create-account" },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: { label: string; icon: React.ElementType; href: string }[];
  pathname: string;
}) {
  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
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
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
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

  return (
    <aside className="flex flex-col h-full">
      {/* Dashboard */}
      <div className="px-3 mb-2">
        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/admin"
              ? "bg-brand-orange text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <LayoutDashboard size={16} className="shrink-0" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Scrollable sections */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3">
        <NavSection title="Management" items={MANAGEMENT_ITEMS} pathname={pathname} />
        <NavSection title="Financial"  items={FINANCIAL_ITEMS}  pathname={pathname} />
        <NavSection title="Admin"      items={ADMIN_ITEMS}      pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="p-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Globe size={15} />
          <span>View Website</span>
        </Link>
      </div>
    </aside>
  );
};

export default Navbar;