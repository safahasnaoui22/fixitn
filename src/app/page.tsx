import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/catalog";
import { unreadNotificationCount } from "@/lib/db/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { ClientBottomNav } from "@/components/ClientBottomNav";
import { CategoryGrid } from "./CategoryGrid";

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

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="bg-brand-navy px-5 pb-6 pt-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar src={null} name={session.fullName} size={38} />
              <div>
                <p className="text-xs text-white/60">Welcome back</p>
                <p className="font-heading text-base font-semibold">
                  {session.fullName.split(" ")[0]}
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
          <p className="font-heading text-xl font-bold">
            What do you need fixed?
          </p>
          <p className="text-sm text-white/60 mt-0.5">
            Pick a category to find verified technicians nearby
          </p>
        </div>

        {/* Categories with search */}
        <div className="px-5 py-5">
          <CategoryGrid categories={categories} />
        </div>
      </div>
      <ClientBottomNav />
    </>
  );
}