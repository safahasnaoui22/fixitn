import Link from "next/link";
import { Users, Phone, MapPin, Briefcase, ChevronRight, ArrowUpRight } from "lucide-react";
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

  const tabs = [
    { label: "All", value: undefined, count: users.length },
    { label: "Clients", value: "CLIENT" },
    { label: "Technicians", value: "TECHNICIAN" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} {users.length === 1 ? "user" : "users"} registered on the platform
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted">
          <div className="h-2 w-2 rounded-full bg-success" />
          Live data
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = role === tab.value || (!role && !tab.value);
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/users?role=${tab.value}` : "/admin/users"}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-navy text-white shadow-sm shadow-brand-navy/20"
                  : "border border-line bg-surface text-muted hover:border-brand-navy/20 hover:text-ink"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-alt text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
            <Users size={22} className="text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">No users found</p>
            <p className="mt-0.5 text-xs text-muted">Try a different filter to see more results.</p>
          </div>
        </div>
      )}

      {/* ── Mobile: card list (below md) ── */}
      {users.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="group rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <Avatar src={user.avatarUrl} name={user.fullName} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-ink">{user.fullName}</p>
                    <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-active:translate-x-0.5" />
                  </div>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      user.role === "TECHNICIAN"
                        ? "bg-brand-orange-light text-brand-orange-dark"
                        : user.role === "ADMIN"
                        ? "bg-brand-navy text-white"
                        : "bg-surface-alt text-muted"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <Phone size={12} />
                  <span className="truncate">{user.phone}</span>
                </div>
                {user.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span className="truncate">{user.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Briefcase size={12} />
                  <span>{user.jobCount} jobs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Desktop/tablet: table (md and up) ── */}
      {users.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  {["User", "Phone", "Role", "Jobs", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-surface-alt">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatarUrl} name={user.fullName} size={34} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{user.fullName}</p>
                          {user.city && (
                            <p className="flex items-center gap-1 text-xs text-muted">
                              <MapPin size={10} />
                              {user.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.role === "TECHNICIAN"
                            ? "bg-brand-orange-light text-brand-orange-dark"
                            : user.role === "ADMIN"
                            ? "bg-brand-navy text-white"
                            : "bg-surface-alt text-muted"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.jobCount}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                      >
                        View
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}