import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getUnreadSupportCount } from "@/lib/db/supportChat";
import { AdminShell } from "@/app/admin/AdminShell";
import { AdminSidebar } from "@/app/admin/AdminSidebar";

export default async function SousAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SOUS_ADMIN") redirect("/");

  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { permissions: true },
    }),
    getUnreadSupportCount(session.userId),
  ]);

  return (
    <AdminShell
      title="Fixili Sous-Admin"
      sidebar={
        <AdminSidebar
          role="SOUS_ADMIN"
          permissions={user?.permissions ?? []}
          unreadCount={unreadCount}
        />
      }
    >
      {children}
    </AdminShell>
  );
}
