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
    <div className="flex h-dvh w-full bg-surface-alt overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        // Close the mobile drawer after tapping any link inside it
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={`
          fixed inset-y-0 left-0 z-30 w-56 flex flex-col
          bg-brand-navy border-r border-line
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white lg:hidden"
        >
          <X size={16} />
        </button>
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-white"
          >
            <Menu size={18} />
          </button>
          <p className="font-heading text-base font-bold text-ink flex-1">
            Fixili Admin
          </p>
          {/* Theme toggle in mobile header */}
          <ThemeToggle />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-line bg-surface shrink-0">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8">
          {/* Cap the width on very large monitors so content stays readable */}
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}