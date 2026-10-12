import type { ReactNode } from "react";

/**
 * Same background photo as the onboarding page (public/fixili-background.jpeg)
 * with a dark layer on top, used by the login and register pages.
 * The photo stays fixed while the form scrolls above it.
 */
export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#050507]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fixili-background.jpeg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        style={{ opacity: 0.95 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
      <div className="app-content relative z-10 px-6 py-8">{children}</div>
    </div>
  );
}