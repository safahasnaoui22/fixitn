import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getAdminUserDetail } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { deleteUserAction } from "../../actions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-ink">User Detail</h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={user.avatarUrl} name={user.fullName} size={64} />
          <div>
            <p className="font-heading text-lg font-bold text-ink">{user.fullName}</p>
            <p className="text-sm text-muted">{user.phone}</p>
            {user.email && <p className="text-sm text-muted">{user.email}</p>}
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${user.role === "TECHNICIAN" ? "bg-brand-orange-light text-brand-orange-dark" : "bg-surface-alt text-muted"}`}>
            {user.role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="City" value={user.city ?? "—"} />
          <InfoRow label="Joined" value={formatDate(user.createdAt)} />
          <InfoRow label="ID" value={user.id.slice(0, 16) + "..."} />
        </div>
      </div>

      {user.recentRequests.length > 0 && (
        <div>
          <p className="font-heading text-base font-semibold text-ink mb-3">Recent Requests</p>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {user.recentRequests.map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt transition-colors">
                <div>
                  <p className="text-sm font-medium text-ink">{req.categoryName}</p>
                  <p className="text-xs text-muted">{formatDate(req.createdAt)}</p>
                </div>
                <StatusBadge status={req.status as import("@/lib/constants").JobStatus} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-danger-light bg-danger-light/30 p-4">
        <p className="font-heading text-sm font-semibold text-danger mb-1">Danger Zone</p>
        <p className="text-xs text-danger/70 mb-3">Deleting this user is permanent and cannot be undone.</p>
        <form action={deleteUserAction.bind(null, id)}>
          <Button type="submit" variant="danger" size="sm"><Trash2 size={15} />Delete User</Button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <p className="text-[10px] text-muted mb-0.5">{label}</p>
      <p className="font-medium text-ink text-sm">{value}</p>
    </div>
  );
}