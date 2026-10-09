"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ClipboardList, MessageCircle,
  Bell, User, LogOut, X, Sun, Moon, HeadphonesIcon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",              icon: Home,          label: "Accueil" },
  { href: "/requests",      icon: ClipboardList, label: "Réservations" },
  { href: "/chats",         icon: MessageCircle, label: "Chat" },
  { href: "/notifications", icon: Bell,          label: "Alertes" },
];

export function ClientBottomNav({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {showProfile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowProfile(false)}
        />
      )}

      {showProfile && (
        <div className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl border-t border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <p className="font-heading text-base font-semibold text-ink">
              Mon compte
            </p>
            <button
              onClick={() => setShowProfile(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt"
            >
              <X size={16} className="text-muted" />
            </button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface-alt px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                {theme === "dark"
                  ? <Sun size={18} className="text-amber-400" />
                  : <Moon size={18} className="text-muted" />
                }
                <span className="text-sm font-medium text-ink">
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </span>
              </div>
              <div className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                theme === "dark" ? "bg-brand-orange" : "bg-line"
              )}>
                <div className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface-alt px-4 py-3.5"
            >
              <User size={18} className="text-muted" />
              <span className="text-sm font-medium text-ink">Mon profil</span>
            </Link>

            {/* Support chat */}
            <Link
              href="/support"
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 rounded-2xl border border-brand-orange/20 bg-brand-orange-light px-4 py-3.5"
            >
              <HeadphonesIcon size={18} className="text-brand-orange" />
              <div>
                <p className="text-sm font-semibold text-brand-orange">
                  Contacter le support
                </p>
                <p className="text-[10px] text-muted">
                  Signalez un problème ou posez une question
                </p>
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl bg-danger-light px-4 py-3.5"
            >
              <LogOut size={18} className="text-danger" />
              <span className="text-sm font-semibold text-danger">
                Se déconnecter
              </span>
            </button>
          </div>
          <div className="h-6" />
        </div>
      )}

      <nav
        className={cn(
          "z-30 border-t",
          dark
            ? "relative shrink-0 border-white/10 bg-[#070B1A]"
            : "fixed bottom-0 inset-x-0 border-line bg-surface"
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 min-w-[52px] py-1"
              >
                <Icon
                  size={22}
                  className={cn(
                    active ? "text-brand-orange" : dark ? "text-white/45" : "text-muted"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-brand-orange" : dark ? "text-white/45" : "text-muted"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowProfile(true)}
            className="flex flex-col items-center gap-0.5 min-w-[52px] py-1"
          >
            <User
              size={22}
              className={cn(
                showProfile ? "text-brand-orange" : dark ? "text-white/45" : "text-muted"
              )}
              strokeWidth={showProfile ? 2.5 : 2}
            />
            <span className={cn(
              "text-[10px] font-medium",
              showProfile ? "text-brand-orange" : dark ? "text-white/45" : "text-muted"
            )}>
              Profil
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}