"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell flex h-dvh w-full min-w-0 overflow-hidden bg-surface-alt">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) {
            setOpen(false);
          }
        }}
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-56 shrink-0 flex-col
          border-r border-line bg-brand-navy
          transition-transform duration-300 ease-in-out

          lg:static
          lg:z-auto
          lg:translate-x-0

          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>

        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <p className="min-w-0 flex-1 truncate font-heading text-base font-bold text-ink">
            Fixili Admin
          </p>

          <ThemeToggle />
        </div>

        {/* Desktop top bar */}
        <div className="hidden h-[61px] shrink-0 items-center justify-end border-b border-line bg-surface px-6 lg:flex">
          <ThemeToggle />
        </div>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}