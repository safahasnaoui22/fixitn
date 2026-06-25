"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/t/dashboard", label: "Home", icon: Home, match: (p: string) => p === "/t/dashboard" },
  { href: "/t/requests", label: "Jobs", icon: ClipboardList, match: (p: string) => p.startsWith("/t/requests") },
  { href: "/t/earnings", label: "Earnings", icon: Wallet, match: (p: string) => p.startsWith("/t/earnings") },
  { href: "/t/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/t/profile") },
] as const;

export function TechBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="flex shrink-0 items-stretch border-t border-line bg-surface">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <Icon
              size={22}
              className={cn(active ? "text-brand-navy" : "text-muted")}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={cn("text-[11px] font-medium", active ? "text-brand-navy" : "text-muted")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}