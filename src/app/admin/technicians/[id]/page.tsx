import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShieldOff } from "lucide-react";
import { getAdminTechnicianDetail } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDT } from "@/lib/utils";
import { verifyTechnicianAction } from "../../actions";

export default async function AdminTechnicianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tech = await getAdminTechnicianDetail(id);
  if (!tech) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/technicians" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-ink">Technician Detail</h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4 mb-5">
          <Avatar src={tech.avatarUrl} name={tech.fullName} size={64} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-heading text-lg font-bold text-ink">{tech.fullName}</p>
              {tech.verified && <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">Verified</span>}
            </div>
            <p className="text-sm text-muted">{tech.title}</p>
            <p className="text-sm text-muted">{tech.phone}</p>
          </div>
          <form action={verifyTechnicianAction.bind(null, id, !tech.verified)}>
            <Button type="submit" size="sm" variant={tech.verified ? "outline" : "primary"}>
              {tech.verified ? <><ShieldOff size={15} />Unverify</> : <><ShieldCheck size={15} />Verify</>}
            </Button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="City" value={tech.city ?? "—"} />
          <InfoRow label="Years exp." value={String(tech.yearsExperience)} />
          <InfoRow label="Starting price" value={formatDT(tech.startingPrice)} />
          <InfoRow label="Joined" value={formatDate(tech.createdAt)} />
          <InfoRow label="Plan" value={tech.planName ?? "Free"} />
          <InfoRow label="Commission" value={tech.commissionRate != null ? `${Math.round(tech.commissionRate * 100)}%` : "15%"} />
        </div>
        {tech.bio && <p className="mt-4 text-sm text-muted leading-relaxed border-t border-line pt-4">{tech.bio}</p>}
      </div>

      {tech.categories.length > 0 && (
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-2">Services</p>
          <div className="flex flex-wrap gap-2">
            {tech.categories.map((cat) => (
              <span key={cat} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">{cat}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted mb-1">Net Earnings</p>
          <p className="font-heading text-xl font-bold text-ink">{formatDT(tech.netEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted mb-1">Platform Fees</p>
          <p className="font-heading text-xl font-bold text-success">{formatDT(tech.feesCollected)}</p>
        </div>
      </div>

      {tech.recentRequests.length > 0 && (
        <div>
          <p className="font-heading text-base font-semibold text-ink mb-3">Recent Jobs</p>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {tech.recentRequests.map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt transition-colors">
                <div>
                  <p className="text-sm font-medium text-ink">{req.categoryName}</p>
                  <p className="text-xs text-muted">Client: {req.clientName} · {formatDate(req.createdAt)}</p>
                </div>
                <StatusBadge status={req.status as import("@/lib/constants").JobStatus} />
              </Link>
            ))}
          </div>
        </div>
      )}
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