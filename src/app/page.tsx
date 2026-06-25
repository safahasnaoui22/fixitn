import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { getPublicUserById } from "@/lib/db/users";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ClientBottomNav } from "@/components/ClientBottomNav";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  if (session.role === "TECHNICIAN") redirect("/t/dashboard");

  const [categories, user, unread] = await Promise.all([
    listCategories(),
    getPublicUserById(session.userId),
    unreadNotificationCount(session.userId),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="bg-brand-navy px-5 pb-8 pt-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={44} />
              <div>
                <p className="text-xs text-white/60">Welcome back</p>
                <p className="font-heading text-base font-semibold">
                  {user?.fullName?.split(" ")[0] ?? "there"}
                </p>
              </div>
            </div>
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
          {user?.city && (
            <div className="mt-4 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin size={14} />
              <span>{user.city}</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-5">
          <p className="font-heading text-lg font-semibold text-ink">What do you need fixed?</p>
          <p className="mt-0.5 text-sm text-muted">
            Pick a category to find verified technicians nearby
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center transition-transform active:scale-95"
              >
                <CategoryIcon icon={cat.icon} color={cat.color} size={24} badgeSize={52} />
                <span className="text-xs font-medium leading-tight text-ink">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </>
  );
}