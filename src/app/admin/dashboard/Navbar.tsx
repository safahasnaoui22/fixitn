"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  LayoutDashboard, Users, Wrench, LayoutGrid,
  ClipboardList, CreditCard, BadgeDollarSign,
  RefreshCcw, Globe, X,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const MANAGEMENT_ITEMS: NavItem[] = [
  { label: "Users", icon: <Users size={16} />, href: "/admin/users" },
  { label: "Technicians", icon: <Wrench size={16} />, href: "/admin/technicians" },
  { label: "Categories", icon: <LayoutGrid size={16} />, href: "/admin/categories" },
  { label: "Jobs / Requests", icon: <ClipboardList size={16} />, href: "/admin/requests" },
];

const FINANCIAL_ITEMS: NavItem[] = [
  { label: "Payments", icon: <CreditCard size={16} />, href: "/admin/payments" },
  { label: "Revenue", icon: <BadgeDollarSign size={16} />, href: "/admin/revenue" },
  { label: "Plans", icon: <RefreshCcw size={16} />, href: "/admin/plans" },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}

const NavSection: React.FC<NavSectionProps> = ({ title, items, pathname, onNavigate }) => (
  <div className={styles.navSection}>
    <span className={styles.navSectionTitle}>{title}</span>
    {items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(item.href + "/");
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
          onClick={onNavigate}
        >
          <span className={styles.navItemIcon}>{item.icon}</span>
          <span className={styles.navItemLabel}>{item.label}</span>
        </Link>
      );
    })}
  </div>
);

interface NavbarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>
          <span className={styles.logoWrench}>🔧</span>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>FixiTN</span>
          <span className={styles.logoSubtitle}>Admin Dashboard</span>
        </div>
        <button className={styles.sidebarCloseBtn} onClick={onClose} aria-label="Close menu">
          <X size={16} />
        </button>
      </div>

      {/* Dashboard link */}
      <div className={styles.navMainItem}>
        <Link
          href="/admin"
          className={`${styles.navItem} ${pathname === "/admin" ? styles.navItemDashboard : ""}`}
          onClick={onClose}
        >
          <span className={styles.navItemIcon}><LayoutDashboard size={16} /></span>
          <span className={styles.navItemLabel}>Dashboard</span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className={styles.sidebarNav}>
        <NavSection title="MANAGEMENT" items={MANAGEMENT_ITEMS} pathname={pathname} onNavigate={onClose} />
        <NavSection title="FINANCIAL" items={FINANCIAL_ITEMS} pathname={pathname} onNavigate={onClose} />
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <Link href="/" className={styles.viewWebsiteBtn}>
          <Globe size={15} />
          <span>View Website</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 2.5H9.5M9.5 2.5V9.5M9.5 2.5L2.5 9.5"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </aside>
  );
};

export default Navbar;