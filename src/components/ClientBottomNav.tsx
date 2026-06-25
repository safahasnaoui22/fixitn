"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/requests", label: "Bookings", icon: ClipboardList, match: (p: string) => p.startsWith("/requests") },
  { href: "/chats", label: "Chat", icon: MessageCircle, match: (p: string) => p.startsWith("/chats") },
  { href: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") },
] as const;

export function ClientBottomNav() {
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
              className={cn(active ? "text-brand-orange" : "text-muted")}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={cn("text-[11px] font-medium", active ? "text-brand-orange" : "text-muted")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}