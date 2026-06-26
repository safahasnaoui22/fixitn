import Link from "next/link";
import { Users, Wrench, Briefcase, TrendingUp, AlertTriangle } from "lucide-react";
import { getAdminStats, listAdminRequests } from "@/lib/db/admin";
import { StatusBadge } from "@/components/ui/Card";
import { formatDT, formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, recentRequests] = await Promise.all([
    getAdminStats(),
    listAdminRequests(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Clients" value={String(stats.totalClients)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Wrench} label="Technicians" value={String(stats.totalTechnicians)} color="bg-brand-orange-light text-brand-orange" />
        <StatCard icon={Briefcase} label="Jobs Today" value={String(stats.jobsToday)} color="bg-success-light text-success" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatDT(stats.totalRevenue)} color="bg-brand-navy text-white" />
      </div>

      {stats.disputes > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            {stats.disputes} completed job{stats.disputes > 1 ? "s" : ""} marked as unsolved — review needed.
          </p>
          <Link href="/admin/requests?status=COMPLETED" className="ml-auto text-xs font-semibold text-amber-700 underline">View</Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-heading text-base font-semibold text-ink">Recent Requests</p>
          <Link href="/admin/requests" className="text-sm text-brand-orange font-medium">View all</Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-line">
              <tr>
                {["Category", "Client", "Technician", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentRequests.slice(0, 8).map((req) => (
                <tr key={req.id} className="hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{req.categoryName}</td>
                  <td className="px-4 py-3 text-muted">{req.clientFullName}</td>
                  <td className="px-4 py-3 text-muted">{req.technicianFullName}</td>
                  <td className="px-4 py-3"><StatusBadge status={req.status as import("@/lib/constants").JobStatus} /></td>
                  <td className="px-4 py-3 text-muted">{formatDate(req.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentRequests.length === 0 && <p className="py-8 text-center text-sm text-muted">No requests yet</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}>
        <Icon size={20} />
      </div>
      <p className="font-heading text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}