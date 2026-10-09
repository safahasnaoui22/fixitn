import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { CategoryGrid } from "./CategoryGrid";
import { DARK_BG } from "@/lib/theme";

export default async function HomePage() {
  const session = await getSession();

  if (!session) redirect("/onboarding");
  if (session.role === "TECHNICIAN") redirect("/t/dashboard");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "SOUS_ADMIN") redirect("/sous-admin");

  const [categories, unread] = await Promise.all([
    listCategories(),
    unreadNotificationCount(session.userId),
  ]);

  const firstName = session.fullName.split(" ")[0];

  return (
    <>
      {/* Dark home — same look as the onboarding screen, independent of the light/dark toggle */}
      <div
        className="app-content no-scrollbar"
        style={{ background: DARK_BG }}
      >
        {/* Top bar: wordmark + bell + avatar */}
        <div className="flex items-center justify-between px-5 pt-6">
          <p className="font-heading text-[26px] font-black leading-none tracking-tight text-white">
            fi<span className="text-brand-orange">x</span>ili
          </p>

          <div className="flex items-center gap-2.5">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1A2650] text-white/80"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link href="/profile" aria-label="Mon profil">
              <Avatar
                src={null}
                name={session.fullName}
                size={40}
                className="!bg-[#1A2650]"
              />
            </Link>
          </div>
        </div>

        {/* Greeting */}
        <div className="px-5 pt-8">
          <p className="font-heading text-[26px] font-bold leading-tight text-white">
            Bonjour {firstName},
          </p>
          <p className="mt-1 text-[22px] font-medium leading-snug text-white/85">
            Comment pouvons-nous
            <br />
            vous aider aujourd&apos;hui ?
          </p>
        </div>

        {/* Search + categories + popular services */}
        <div className="px-5 pb-8 pt-6">
          <CategoryGrid categories={categories} />
        </div>
      </div>
      <ClientBottomNav dark />
    </>
  );
}