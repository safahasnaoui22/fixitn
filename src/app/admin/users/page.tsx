import Link from "next/link";
import { Users, Phone, MapPin, Briefcase, ChevronRight, ArrowUpRight, Wrench, UserCircle2 } from "lucide-react";
import { listAdminUsers } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

const ROLE_STYLES: Record<string, { badge: string; ring: string; dot: string }> = {
  TECHNICIAN: {
    badge: "bg-brand-orange-light text-brand-orange-dark",
    ring: "ring-brand-orange/30",
    dot: "bg-brand-orange",
  },
  ADMIN: {
    badge: "bg-brand-navy text-white",
    ring: "ring-brand-navy/30",
    dot: "bg-brand-navy",
  },
  CLIENT: {
    badge: "bg-blue-50 text-blue-700",
    ring: "ring-blue-500/25",
    dot: "bg-blue-500",
  },
};

function roleStyle(role: string) {
  return ROLE_STYLES[role] ?? { badge: "bg-surface-alt text-muted", ring: "ring-line", dot: "bg-muted" };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const users = await listAdminUsers(role);

  const technicianCount = users.filter((u) => u.role === "TECHNICIAN").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;

  const tabs = [
    { label: "All", value: undefined, count: users.length, icon: Users },
    { label: "Clients", value: "CLIENT", count: clientCount, icon: UserCircle2 },
    { label: "Technicians", value: "TECHNICIAN", count: technicianCount, icon: Wrench },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header banner: signature element ── */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-navy px-6 py-8 sm:px-8 sm:py-10">
        {/* dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* orange glow, beacon-like */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-orange/40 blur-[90px]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-brand-orange-dark/20 blur-[80px]" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live directory
            </div>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">People on FixiTN</h1>
            <p className="mt-1.5 text-sm text-white/60">
              {users.length} {users.length === 1 ? "account" : "accounts"} across clients and technicians
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6">
            <div>
              <p className="font-heading text-xl font-bold text-white sm:text-2xl">{clientCount}</p>
              <p className="text-xs font-medium text-white/50">Clients</p>
            </div>
            <div className="w-px bg-white/15" />
            <div>
              <p className="font-heading text-xl font-bold text-white sm:text-2xl">{technicianCount}</p>
              <p className="text-xs font-medium text-white/50">Technicians</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = role === tab.value || (!role && !tab.value);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/users?role=${tab.value}` : "/admin/users"}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                  : "border border-line bg-surface text-muted hover:border-brand-navy/20 hover:text-ink hover:shadow-sm"
              }`}
            >
              <Icon size={14} className={isActive ? "text-brand-orange" : "text-muted"} />
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-alt text-muted"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange-light">
            <Users size={22} className="text-brand-orange" />
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
          {users.map((user) => {
            const rs = roleStyle(user.role);
            return (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all active:scale-[0.99]"
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${rs.dot}`} />
                <div className="flex items-start gap-3 pl-1.5">
                  <div className={`rounded-full ring-2 ring-offset-2 ring-offset-surface ${rs.ring}`}>
                    <Avatar src={user.avatarUrl} name={user.fullName} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-ink">{user.fullName}</p>
                      <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-active:translate-x-0.5" />
                    </div>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${rs.badge}`}>
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
            );
          })}
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
                {users.map((user) => {
                  const rs = roleStyle(user.role);
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-surface-alt">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full ring-2 ring-offset-2 ring-offset-surface ${rs.ring}`}>
                            <Avatar src={user.avatarUrl} name={user.fullName} size={34} />
                          </div>
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
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${rs.badge}`}>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}