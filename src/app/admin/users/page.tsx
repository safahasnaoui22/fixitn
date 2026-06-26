import Link from "next/link";
import { Users } from "lucide-react";
import { listAdminUsers } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const users = await listAdminUsers(role);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Users</h1>
        <p className="text-sm text-muted mt-0.5">{users.length} total</p>
      </div>

      <div className="flex gap-2">
        {[{ label: "All", value: undefined }, { label: "Clients", value: "CLIENT" }, { label: "Technicians", value: "TECHNICIAN" }].map((tab) => (
          <Link key={tab.label} href={tab.value ? `/admin/users?role=${tab.value}` : "/admin/users"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              role === tab.value || (!role && !tab.value)
                ? "bg-brand-navy text-white"
                : "bg-surface border border-line text-muted hover:text-ink"
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {["User", "Phone", "Role", "Jobs", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatarUrl} name={user.fullName} size={32} />
                    <div>
                      <p className="font-medium text-ink">{user.fullName}</p>
                      {user.city && <p className="text-xs text-muted">{user.city}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{user.phone}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    user.role === "TECHNICIAN" ? "bg-brand-orange-light text-brand-orange-dark"
                    : user.role === "ADMIN" ? "bg-brand-navy text-white"
                    : "bg-surface-alt text-muted"
                  }`}>{user.role}</span>
                </td>
                <td className="px-4 py-3 text-muted">{user.jobCount}</td>
                <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-xs font-semibold text-brand-orange hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users size={28} className="text-muted" />
            <p className="text-sm text-muted">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}