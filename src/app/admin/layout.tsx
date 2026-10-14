import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getUnreadSupportCount } from "@/lib/db/supportChat";
import { AdminShell } from "./AdminShell";
import { AdminSidebar } from "./AdminSidebar";

// Shared by the ADMIN and by a SOUS_ADMIN who was given some functions.
// Each page checks its own permission (requirePermission); the menu only
// shows what the user is allowed to open.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (session.role !== "ADMIN" && session.role !== "SOUS_ADMIN") redirect("/");

  if (session.role === "ADMIN") {
    return (
      <AdminShell sidebar={<AdminSidebar role="ADMIN" />}>{children}</AdminShell>
    );
  }

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
