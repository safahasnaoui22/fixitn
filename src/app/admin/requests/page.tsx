import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { listAdminRequests } from "@/lib/db/admin";
import { StatusBadge } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "@/lib/constants";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const requests = await listAdminRequests(status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Requests</h1>
        <p className="text-sm text-muted mt-0.5">{requests.length} {status ? JOB_STATUS_LABEL[status as keyof typeof JOB_STATUS_LABEL] : "total"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/requests" className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!status ? "bg-brand-navy text-white" : "bg-surface border border-line text-muted hover:text-ink"}`}>All</Link>
        {JOB_STATUSES.map((s) => (
          <Link key={s} href={`/admin/requests?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${status === s ? "bg-brand-navy text-white" : "bg-surface border border-line text-muted hover:text-ink"}`}>
            {JOB_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {["Category", "Client", "Technician", "Status", "Solved?", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3 font-medium text-ink">{req.categoryName}</td>
                <td className="px-4 py-3 text-muted">{req.clientFullName}</td>
                <td className="px-4 py-3 text-muted">{req.technicianFullName}</td>
                <td className="px-4 py-3"><StatusBadge status={req.status as import("@/lib/constants").JobStatus} /></td>
                <td className="px-4 py-3">
                  {req.clientConfirmedSolved === null ? <span className="text-muted text-xs">—</span>
                    : req.clientConfirmedSolved ? <span className="text-xs font-semibold text-success">✓ Yes</span>
                    : <span className="text-xs font-semibold text-danger">✗ No</span>}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(req.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/requests/${req.id}`} className="text-xs font-semibold text-brand-orange hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList size={28} className="text-muted" />
            <p className="text-sm text-muted">No requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}