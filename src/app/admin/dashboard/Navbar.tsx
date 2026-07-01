"use client";

import React, { useState } from "react";
import styles from "./dashboard.module.css";
import {
  LayoutDashboard,
  Users,
  Wrench,
  UserRound,
  LayoutGrid,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  BadgeDollarSign,
  Wallet,
  ArrowLeftRight,
  RefreshCcw,
  Star,
  AlertTriangle,
  HeadphonesIcon,
  Bell,
  BarChart2,
  Settings,
  ScrollText,
  Globe,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavItem[];
  badge?: number;
}

const MANAGEMENT_ITEMS: NavItem[] = [
  {
    label: "Users",
    icon: <Users size={16} />,
    children: [
      { label: "All Users", icon: <UserRound size={14} /> },
      { label: "Admins", icon: <UserRound size={14} /> },
    ],
  },
  { label: "Technicians", icon: <Wrench size={16} /> },
  { label: "Clients", icon: <UserRound size={16} /> },
  { label: "Categories", icon: <LayoutGrid size={16} /> },
  { label: "Jobs / Requests", icon: <ClipboardList size={16} /> },
  { label: "Bookings", icon: <CalendarCheck size={16} /> },
];

const FINANCIAL_ITEMS: NavItem[] = [
  { label: "Payments", icon: <CreditCard size={16} /> },
  { label: "Earnings & Payouts", icon: <BadgeDollarSign size={16} /> },
  { label: "Payment Methods", icon: <Wallet size={16} /> },
  { label: "Transactions", icon: <ArrowLeftRight size={16} /> },
  { label: "Subscriptions", icon: <RefreshCcw size={16} /> },
];

const SUPPORT_ITEMS: NavItem[] = [
  { label: "Reviews", icon: <Star size={16} /> },
  { label: "Disputes", icon: <AlertTriangle size={16} /> },
  { label: "Support Center", icon: <HeadphonesIcon size={16} /> },
];

const SYSTEM_ITEMS: NavItem[] = [
  { label: "Notifications", icon: <Bell size={16} /> },
  { label: "Reports & Analytics", icon: <BarChart2 size={16} /> },
  { label: "Settings", icon: <Settings size={16} /> },
  { label: "System Logs", icon: <ScrollText size={16} /> },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  activeItem: string;
  onSelect: (label: string) => void;
}

const NavSection: React.FC<NavSectionProps> = ({
  title,
  items,
  activeItem,
  onSelect,
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleClick = (item: NavItem) => {
    if (item.children) {
      setExpandedItem(expandedItem === item.label ? null : item.label);
    } else {
      onSelect(item.label);
    }
  };

  return (
    <div className={styles.navSection}>
      <span className={styles.navSectionTitle}>{title}</span>
      {items.map((item) => (
        <div key={item.label}>
          <button
            className={`${styles.navItem} ${
              activeItem === item.label ? styles.navItemActive : ""
            }`}
            onClick={() => handleClick(item)}
          >
            <span className={styles.navItemIcon}>{item.icon}</span>
            <span className={styles.navItemLabel}>{item.label}</span>
            {item.children && (
              <ChevronDown
                size={14}
                className={`${styles.navChevron} ${
                  expandedItem === item.label ? styles.navChevronOpen : ""
                }`}
              />
            )}
          </button>
          {item.children && expandedItem === item.label && (
            <div className={styles.navSubItems}>
              {item.children.map((child) => (
                <button
                  key={child.label}
                  className={`${styles.navSubItem} ${
                    activeItem === child.label ? styles.navItemActive : ""
                  }`}
                  onClick={() => onSelect(child.label)}
                >
                  <span className={styles.navItemIcon}>{child.icon}</span>
                  <span>{child.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface NavbarProps {
  activeItem?: string;
  onSelect?: (label: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  activeItem = "Dashboard",
  onSelect,
}) => {
  const [active, setActive] = useState(activeItem);

  const handleSelect = (label: string) => {
    setActive(label);
    onSelect?.(label);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>
          <span className={styles.logoWrench}>🔧</span>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>FixiTN</span>
          <span className={styles.logoSubtitle}>Admin Dashboard</span>
        </div>
      </div>

      {/* Dashboard */}
      <div className={styles.navMainItem}>
        <button
          className={`${styles.navItem} ${
            active === "Dashboard" ? styles.navItemDashboard : ""
          }`}
          onClick={() => handleSelect("Dashboard")}
        >
          <span className={styles.navItemIcon}>
            <LayoutDashboard size={16} />
          </span>
          <span className={styles.navItemLabel}>Dashboard</span>
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className={styles.sidebarNav}>
        <NavSection
          title="MANAGEMENT"
          items={MANAGEMENT_ITEMS}
          activeItem={active}
          onSelect={handleSelect}
        />
        <NavSection
          title="FINANCIAL"
          items={FINANCIAL_ITEMS}
          activeItem={active}
          onSelect={handleSelect}
        />
        <NavSection
          title="REVIEWS & SUPPORT"
          items={SUPPORT_ITEMS}
          activeItem={active}
          onSelect={handleSelect}
        />
        <NavSection
          title="SYSTEM"
          items={SYSTEM_ITEMS}
          activeItem={active}
          onSelect={handleSelect}
        />
      </nav>

      {/* Bottom: View Website */}
      <div className={styles.sidebarFooter}>
        <button className={styles.viewWebsiteBtn}>
          <Globe size={15} />
          <span>View Website</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 2.5H9.5M9.5 2.5V9.5M9.5 2.5L2.5 9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;