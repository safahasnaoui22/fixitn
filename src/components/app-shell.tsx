// components/app-shell.tsx
"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps every page in the phone-proportioned frame (`.app-shell`, max 480px)
 * EXCEPT the admin panel, which has its own sidebar + content layout and
 * needs the full browser width on laptops and desktops.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  if (isAdmin) {
    return <div className="w-full">{children}</div>;
  }

  return <div className="app-shell">{children}</div>;
}