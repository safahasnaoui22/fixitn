"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Wallet,
  User, LogOut, X, Sun, Moon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/t/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/t/requests",  icon: ClipboardList,   label: "Missions" },
  { href: "/t/earnings",  icon: Wallet,          label: "Gains" },
];

export function TechBottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
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
        <div className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl border-t border-line bg-surface pb-safe shadow-2xl">
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

            <Link
              href="/t/profile"
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface-alt px-4 py-3.5"
            >
              <User size={18} className="text-muted" />
              <span className="text-sm font-medium text-ink">Mon profil</span>
            </Link>

            <Link
              href="/t/portfolio"
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface-alt px-4 py-3.5"
            >
              <span className="text-sm font-medium text-ink">
                Mon portfolio
              </span>
            </Link>

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
          <div className="h-4" />
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {TABS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
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
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-brand-orange" : "text-muted"
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
                "transition-colors",
                showProfile ? "text-brand-orange" : "text-muted"
              )}
              strokeWidth={showProfile ? 2.5 : 2}
            />
            <span className={cn(
              "text-[10px] font-medium",
              showProfile ? "text-brand-orange" : "text-muted"
            )}>
              Profil
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}