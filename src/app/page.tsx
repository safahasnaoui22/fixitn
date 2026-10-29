import { redirect } from "next/navigation";
import { Bell, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { listHomeTechnicians } from "@/lib/db/homeTechnicians";
import { getPublicUserById } from "@/lib/db/users";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { CategoryGrid } from "./CategoryGrid";
import { DARK_BG, NAVY_TILE } from "@/lib/theme";

export default async function HomePage() {
  const session = await getSession();

  if (!session) redirect("/onboarding");
  if (session.role === "TECHNICIAN") redirect("/t/dashboard");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "SOUS_ADMIN") redirect("/sous-admin");

  const [categories, unread, technicians, me] = await Promise.all([
    listCategories(),
    unreadNotificationCount(session.userId),
    listHomeTechnicians(),
    getPublicUserById(session.userId),
  ]);
  const city = me?.city?.trim() || "Tunis";

  const firstName = session.fullName.split(" ")[0];

  return (
    <>
      {/* Dark home — same look as the onboarding screen, independent of the light/dark toggle */}
      <div
        className="app-content no-scrollbar"
        style={{ background: DARK_BG }}
      >
        {/* Top bar: wordmark + location + bell + avatar */}
        <div className="flex items-center justify-between gap-2 px-5 pt-6">
          <p className="font-heading text-[28px] font-black leading-none tracking-tight text-white">
            fi<span className="text-brand-orange">x</span>ili
          </p>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[13px] font-medium text-white"
              style={{ backgroundColor: NAVY_TILE }}
              title="Votre ville"
            >
              <MapPin size={15} className="text-brand-orange" />
              <span className="max-w-[84px] truncate">{city}</span>
              <ChevronDown size={14} className="text-white/50" />
            </div>
            <Link
              href="/notifications"
              aria-label="Notifications"
              style={{ backgroundColor: NAVY_TILE }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              aria-label="Mon profil"
              className="rounded-full border border-white/10"
              style={{ backgroundColor: NAVY_TILE }}
            >
              <Avatar
                src={me?.avatarUrl ?? null}
                name={session.fullName}
                size={38}
                className="!bg-transparent"
              />
            </Link>
          </div>
        </div>

        {/* Greeting (small) */}
        <div className="px-5 pt-5">
          <p className="text-[13px] text-white/60">Bonjour {firstName} 👋</p>
          <p className="font-heading text-[20px] font-bold leading-tight text-white">
            Comment pouvons-nous vous aider ?
          </p>
        </div>

        {/* Search + categories + popular services */}
        <div className="px-5 pb-8 pt-6">
          <CategoryGrid categories={categories} technicians={technicians} />
        </div>
      </div>
      <ClientBottomNav dark />
    </>
  );
}