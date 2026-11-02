"use client";

import { useRouter } from "next/navigation";

/** Table row that opens `href` when clicked (keyboard: Enter). */
export function ClickableRow({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      tabIndex={0}
      role="link"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
      className={`cursor-pointer transition-colors hover:bg-surface-alt focus:bg-surface-alt focus:outline-none ${className}`}
    >
      {children}
    </tr>
  );
}
