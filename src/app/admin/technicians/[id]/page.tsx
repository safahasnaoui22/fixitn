import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  FileText,
  ExternalLink,
  Crown,
  Star,
  ThumbsUp,
  Briefcase,
  Scan,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getAdminTechnicianDetail } from "@/lib/db/admin";
import { hasFaceDescriptor } from "@/lib/db/face";
import { getRatingBreakdown } from "@/lib/db/reviews";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { SeniorBadge } from "@/components/SeniorBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDT } from "@/lib/utils";
import {
  verifyTechnicianAction,
  promoteSeniorAction,
  resetFaceAction,
} from "../../actions";
import type { JobStatus } from "@/lib/constants";

export default async function AdminTechnicianDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;

  const tech = await getAdminTechnicianDetail(id);
  if (!tech) notFound();

  const [faceRegistered, ratingBreakdown] = await Promise.all([
    hasFaceDescriptor(tech.userId),
    getRatingBreakdown(id),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/technicians"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Technician Detail
          </h1>
          <p className="text-xs text-muted font-mono">{id.slice(0, 20)}...</p>
        </div>
      </div>

      {/* Success feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            {success === "promoted" && "Technician promoted to Senior Pro."}
            {success === "demoted" && "Technician moved back to Beginner."}
            {success === "verified" && "Technician marked as verified."}
            {success === "unverified" && "Verification removed."}
          </p>
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4 mb-5">
          <Avatar src={tech.avatarUrl} name={tech.fullName} size={64} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-heading text-lg font-bold text-ink">
                {tech.fullName}
              </p>
              {tech.verified && (
                <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">
                  Verified
                </span>
              )}
              {tech.isSenior && <SeniorBadge size="sm" />}
            </div>
            <p className="text-sm text-muted">{tech.title}</p>
            <p className="text-sm text-muted">{tech.phone}</p>
            {tech.email && (
              <p className="text-sm text-muted">{tech.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <InfoRow label="City" value={tech.city ?? "—"} />
          <InfoRow label="Years exp." value={String(tech.yearsExperience)} />
          <InfoRow
            label="Starting price"
            value={formatDT(tech.startingPrice)}
          />
          <InfoRow label="Joined" value={formatDate(tech.createdAt)} />
          <InfoRow label="Plan" value={tech.planName ?? "Beginner"} />
          <InfoRow
            label="Commission"
            value={
              tech.commissionRate != null
                ? `${Math.round(tech.commissionRate * 100)}%`
                : "15%"
            }
          />
        </div>

        {tech.bio && (
          <p className="text-sm text-muted leading-relaxed border-t border-line pt-4">
            {tech.bio}
          </p>
        )}
      </div>

      {/* Services */}
      {tech.categories.length > 0 && (
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-2">
            Services
          </p>
          <div className="flex flex-wrap gap-2">
            {tech.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Identity documents */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-muted" />
          <p className="font-heading text-base font-semibold text-ink">
            Identity Documents
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* CIN */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-muted shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">
                  CIN / Passport
                </p>
                <p className="text-xs text-muted">
                  Identity verification document
                </p>
              </div>
            </div>
            {tech.cinUrl ? (
              <a
                href={tech.cinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange-dark hover:bg-brand-orange hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                View
              </a>
            ) : (
              <span className="rounded-full bg-danger-light px-2.5 py-1 text-[11px] font-semibold text-danger">
                Not uploaded
              </span>
            )}
          </div>

          {/* Diplome */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-muted shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">
                  Diploma / Certificate
                </p>
                <p className="text-xs text-muted">
                  Professional qualification
                </p>
              </div>
            </div>
            {tech.diplomeUrl ? (
              <a
                href={tech.diplomeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange-dark hover:bg-brand-orange hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                View
              </a>
            ) : (
              <span className="rounded-full bg-danger-light px-2.5 py-1 text-[11px] font-semibold text-danger">
                Not uploaded
              </span>
            )}
          </div>
        </div>

        {/* Verify / Unverify toggle */}
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-xs text-muted mb-2">
            After reviewing documents, mark the account as verified:
          </p>
          <form
            action={verifyTechnicianAction.bind(null, id, !tech.verified)}
          >
            <Button
              type="submit"
              size="sm"
              variant={tech.verified ? "outline" : "primary"}
            >
              {tech.verified ? (
                <>
                  <ShieldOff size={15} />
                  Remove Verification
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  Mark as Verified
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Senior Pro management */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown
            size={18}
            className={tech.isSenior ? "text-amber-500" : "text-muted"}
          />
          <p className="font-heading text-base font-semibold text-ink">
            Senior Pro Status
          </p>
          {tech.isSenior && <SeniorBadge size="sm" />}
        </div>

        {/* Rating breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-surface-alt px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={12} className="fill-star text-star" />
              <p className="font-heading text-base font-bold text-ink">
                {ratingBreakdown.avg?.toFixed(1) ?? "—"}
              </p>
            </div>
            <p className="text-[10px] text-muted">Avg rating</p>
          </div>
          <div className="rounded-xl bg-surface-alt px-3 py-2.5 text-center">
            <p className="font-heading text-base font-bold text-ink">
              {ratingBreakdown.counts[5] ?? 0}
            </p>
            <p className="text-[10px] text-muted">5-star reviews</p>
          </div>
          <div className="rounded-xl bg-surface-alt px-3 py-2.5 text-center">
            <p className="font-heading text-base font-bold text-ink">
              {ratingBreakdown.total}
            </p>
            <p className="text-[10px] text-muted">Total reviews</p>
          </div>
        </div>

        {tech.isSenior ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-success font-medium">
              ✓ This technician has Senior Pro status
            </p>
            <form action={promoteSeniorAction.bind(null, id, false)}>
              <Button type="submit" variant="outline" size="sm">
                <ShieldOff size={15} />
                Demote to Beginner
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              This technician is on the Beginner plan. You can manually
              promote them to Senior Pro, or let the automatic system
              handle it when they meet the criteria.
            </p>
            <form action={promoteSeniorAction.bind(null, id, true)}>
              <Button type="submit" size="sm">
                <Crown size={15} />
                Manually Promote to Senior Pro
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Face ID */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scan
            size={18}
            className={faceRegistered ? "text-success" : "text-muted"}
          />
          <p className="font-heading text-base font-semibold text-ink">
            Face ID Security
          </p>
        </div>

        {faceRegistered ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-success font-medium">
              ✓ Face ID is registered for this account
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs text-amber-700">
                Only reset if the technician has genuinely lost access and
                cannot verify their identity. They will need to re-register
                their face on next login.
              </p>
            </div>
            <form action={resetFaceAction.bind(null, tech.userId)}>
              <Button type="submit" variant="danger" size="sm">
                <AlertTriangle size={15} />
                Reset Face ID &amp; All Devices
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-amber-600">
            Face ID not yet registered — technician will be prompted on
            next login.
          </p>
        )}
      </div>

      {/* Earnings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase size={14} className="text-success" />
            <p className="text-xs text-muted">Net Earnings</p>
          </div>
          <p className="font-heading text-xl font-bold text-ink">
            {formatDT(tech.netEarnings)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ThumbsUp size={14} className="text-brand-orange" />
            <p className="text-xs text-muted">Platform Fees</p>
          </div>
          <p className="font-heading text-xl font-bold text-success">
            {formatDT(tech.feesCollected)}
          </p>
        </div>
      </div>

      {/* Recent jobs */}
      {tech.recentRequests.length > 0 && (
        <div>
          <p className="font-heading text-base font-semibold text-ink mb-3">
            Recent Jobs
          </p>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {tech.recentRequests.map((req) => (
              <Link
                key={req.id}
                href={`/admin/requests/${req.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {req.categoryName}
                  </p>
                  <p className="text-xs text-muted">
                    Client: {req.clientName} · {formatDate(req.createdAt)}
                  </p>
                </div>
                <StatusBadge status={req.status as JobStatus} />
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
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}