"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function AdminShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [children]);

  return (
    <div className="flex h-screen bg-surface-alt overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-56 flex flex-col border-r border-line bg-brand-navy
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close button */}
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
          <p className="font-heading text-base font-bold text-ink">
            FixiTN Admin
          </p>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}