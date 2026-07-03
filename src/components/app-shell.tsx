// components/app-shell.tsx
"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>; // no phone-frame div at all
  }

  return <div className="app-shell-3">{children}</div>;
}