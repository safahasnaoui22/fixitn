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
    <div className="flex min-h-screen w-full overflow-x-hidden bg-surface-alt">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-56 shrink-0 flex-col
          border-r border-line bg-brand-navy
          transition-transform duration-300 ease-in-out

          lg:sticky
          lg:top-0
          lg:h-screen
          lg:translate-x-0
          lg:z-30

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

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white shadow-sm"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <p className="min-w-0 flex-1 truncate font-heading text-base font-bold text-ink">
            Fixili Admin
          </p>

          {/* Theme toggle in mobile header */}
          <ThemeToggle />
        </div>

        {/* Desktop top bar */}
        <div className="sticky top-0 z-20 hidden h-[61px] shrink-0 items-center justify-end border-b border-line bg-surface/95 px-6 backdrop-blur-md lg:flex">
          <ThemeToggle />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-5 sm:py-6 lg:px-7 lg:py-7 xl:px-8 2xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}