"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, MessageCircle, Bell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",         icon: Home,          label: "Home" },
  { href: "/requests", icon: ClipboardList, label: "Bookings" },
  { href: "/chats",    icon: MessageCircle, label: "Chat" },
  { href: "/notifications", icon: Bell,     label: "Alerts" },
];

export function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-surface pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[52px] py-1"
            >
              <Icon
                size={22}
                className={cn(
                  "transition-colors",
                  active ? "text-brand-orange" : "text-muted"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-brand-orange" : "text-muted"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Theme toggle in bottom nav */}
        <div className="flex flex-col items-center gap-0.5 min-w-[52px] py-1">
          <ThemeToggle />
          <span className="text-[10px] font-medium text-muted">Theme</span>
        </div>
      </div>
    </nav>
  );
}