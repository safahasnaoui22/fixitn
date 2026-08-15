import Link from "next/link";
import {
  Wrench, ShieldCheck, CheckCircle2,
  XCircle, Archive, FileText, ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Avatar } from "@/components/ui/Avatar";
import { SeniorBadge } from "@/components/SeniorBadge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import {
  approveTechnicianAction,
  declineTechnicianAction,
  archiveTechnicianAction,
  updateTechnicianPlanAction,
} from "./actions";

type AccountStatus = "PENDING" | "ACTIVE" | "DECLINED" | "ARCHIVED";

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Declined", value: "DECLINED" },
  { label: "Archived", value: "ARCHIVED" },
];

const STATUS_BADGE: Record<AccountStatus, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  ACTIVE:   "bg-success-light text-success",
  DECLINED: "bg-danger-light text-danger",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function AdminTechniciansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "ALL" } = await searchParams;
  const activeStatus = status as AccountStatus | "ALL";

  const [technicians, plans, counts] = await Promise.all([
    prisma.technician.findMany({
      where: activeStatus === "ALL" ? {} : { accountStatus: activeStatus },
      include: {
        user: {
          select: {
            id: true, fullName: true, phone: true,
            avatarUrl: true, city: true, createdAt: true,
          },
        },
        plan: { select: { id: true, key: true, name: true } },
        categories: { select: { name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { requestsReceived: { where: { status: "COMPLETED" } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ orderBy: { price: "asc" } }),
    prisma.technician.groupBy({ by: ["accountStatus"], _count: true }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.accountStatus, c._count])
  ) as Record<string, number>;

  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Technicians
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {totalCount} registered ·{" "}
          {countMap["PENDING"] ?? 0} pending approval
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "ALL"
              ? totalCount
              : (countMap[tab.value] ?? 0);
          const isActive = activeStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/technicians?status=${tab.value}`}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-navy text-white"
                  : "bg-surface border border-line text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.value === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-surface-alt text-muted"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Technician list */}
      {technicians.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface py-16 text-center">
          <Wrench size={32} className="text-muted" />
          <p className="text-sm text-muted">No technicians found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {technicians.map((tech) => {
            const accountStatus = tech.accountStatus as AccountStatus;
            const ratingCount = tech.reviews.length;
            const ratingAvg =
              ratingCount > 0
                ? tech.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount
                : null;

            return (
              <div
                key={tech.id}
                className={`rounded-2xl border bg-surface overflow-hidden ${
                  accountStatus === "PENDING"
                    ? "border-amber-200"
                    : "border-line"
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-4 p-4">
                  <Avatar
                    src={tech.user.avatarUrl}
                    name={tech.user.fullName}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <Link
                        href={`/admin/technicians/${tech.id}`}
                        className="font-heading text-base font-semibold text-ink hover:text-brand-orange transition-colors"
                      >
                        {tech.user.fullName}
                      </Link>
                      {tech.isSenior && <SeniorBadge size="sm" />}
                      {tech.verified && (
                        <ShieldCheck size={14} className="text-success shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted">{tech.title}</p>
                    <p className="text-xs text-muted">
                      {tech.user.phone}
                      {tech.user.city && ` · ${tech.user.city}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      {ratingAvg != null && (
                        <span>⭐ {ratingAvg.toFixed(1)} ({ratingCount})</span>
                      )}
                      <span>
                        {tech._count.requestsReceived} jobs
                      </span>
                      <span>{formatDate(tech.user.createdAt.toISOString())}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      STATUS_BADGE[accountStatus]
                    }`}
                  >
                    {accountStatus}
                  </span>
                </div>

                {/* Categories */}
                {tech.categories.length > 0 && (
                  <div className="border-t border-line px-4 py-2.5 flex flex-wrap gap-1.5">
                    {tech.categories.map((cat) => (
                      <span
                        key={cat.name}
                        className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Documents */}
                <div className="border-t border-line px-4 py-2.5 flex flex-wrap gap-2">
                  {tech.cinUrl ? (
                    
                    <a  href={tech.cinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs text-ink hover:border-brand-orange transition-colors"
                    >
                      <FileText size={11} />
                      CIN
                      <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-danger-light px-2.5 py-1 text-xs text-danger">
                      No CIN
                    </span>
                  )}
                  {tech.diplomeUrl ? (
                    
                    <a   href={tech.diplomeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs text-ink hover:border-brand-orange transition-colors"
                    >
                      <FileText size={11} />
                      Diploma
                      <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-danger-light px-2.5 py-1 text-xs text-danger">
                      No Diploma
                    </span>
                  )}
                </div>

                {/* Plan selector + actions */}
                <div className="border-t border-line px-4 py-3 flex flex-wrap items-center gap-3">
                  {/* Plan selector */}
                  <form action={updateTechnicianPlanAction.bind(null, tech.id)}>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-muted shrink-0">
                        Plan:
                      </label>
                      <select
                        name="planId"
                        defaultValue={tech.plan?.id ?? ""}
                        className="rounded-lg border border-line px-2 py-1.5 text-xs outline-none focus:border-brand-orange bg-surface"
                      >
                        <option value="">— None —</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-surface-alt px-2 py-1.5 text-[11px] font-semibold text-muted hover:text-ink transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  {/* View detail link */}
                  <Link
                    href={`/admin/technicians/${tech.id}`}
                    className="text-xs font-semibold text-brand-orange hover:underline ml-auto"
                  >
                    View →
                  </Link>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {accountStatus === "PENDING" && (
                      <>
                        <form action={declineTechnicianAction.bind(null, tech.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-danger border-danger-light hover:bg-danger-light"
                          >
                            <XCircle size={14} />
                            Decline
                          </Button>
                        </form>
                        <form action={approveTechnicianAction.bind(null, tech.id)}>
                          <Button type="submit" size="sm">
                            <CheckCircle2 size={14} />
                            Approve
                          </Button>
                        </form>
                      </>
                    )}

                    {accountStatus === "ACTIVE" && (
                      <>
                        <form action={archiveTechnicianAction.bind(null, tech.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            <Archive size={14} />
                            Archive
                          </Button>
                        </form>
                        <form action={declineTechnicianAction.bind(null, tech.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-danger border-danger-light hover:bg-danger-light"
                          >
                            <XCircle size={14} />
                            Decline
                          </Button>
                        </form>
                      </>
                    )}

                    {(accountStatus === "DECLINED" ||
                      accountStatus === "ARCHIVED") && (
                      <form action={approveTechnicianAction.bind(null, tech.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          <CheckCircle2 size={14} />
                          Re-approve
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}