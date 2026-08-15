import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2, XCircle, Archive,
  ShieldCheck, FileText, ExternalLink,
} from "lucide-react";
import { getSession } from "@/lib/auth";
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
} from "../actions";

type AccountStatus = "PENDING" | "ACTIVE" | "DECLINED" | "ARCHIVED";

const STATUS_TABS: { label: string; value: AccountStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Declined", value: "DECLINED" },
  { label: "Archived", value: "ARCHIVED" },
];

const STATUS_BADGE: Record<AccountStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-success-light text-success",
  DECLINED: "bg-danger-light text-danger",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function SousAdminTechniciansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "SOUS_ADMIN") redirect("/login");

  const { status = "PENDING" } = await searchParams;
  const activeStatus = status as AccountStatus | "ALL";

  const technicians = await prisma.technician.findMany({
    where:
      activeStatus === "ALL"
        ? {}
        : { accountStatus: activeStatus },
    include: {
      user: {
        select: {
          id: true, fullName: true, phone: true,
          avatarUrl: true, city: true, createdAt: true,
        },
      },
      plan: { select: { id: true, key: true, name: true } },
      categories: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all plans for the plan selector
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

  // Count per status for tab badges
  const counts = await prisma.technician.groupBy({
    by: ["accountStatus"],
    _count: true,
  });
  const countMap = Object.fromEntries(
    counts.map((c) => [c.accountStatus, c._count])
  ) as Record<string, number>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Technicians
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Review and manage technician accounts
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "ALL"
              ? Object.values(countMap).reduce((a, b) => a + b, 0)
              : countMap[tab.value] ?? 0;
          const isActive = activeStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/sous-admin/technicians?status=${tab.value}`}
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
          <CheckCircle2 size={32} className="text-muted" />
          <p className="text-base font-semibold text-ink">
            No technicians in this category
          </p>
          <p className="text-sm text-muted">
            {activeStatus === "PENDING"
              ? "No pending approvals — you're all caught up!"
              : `No ${activeStatus.toLowerCase()} technicians found.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {technicians.map((tech) => {
            const accountStatus = tech.accountStatus as AccountStatus;
            return (
              <div
                key={tech.id}
                className={`rounded-2xl border bg-surface overflow-hidden ${
                  accountStatus === "PENDING"
                    ? "border-amber-200"
                    : "border-line"
                }`}
              >
                {/* Tech header */}
                <div className="flex items-start gap-4 p-4">
                  <Avatar
                    src={tech.user.avatarUrl}
                    name={tech.user.fullName}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-heading text-base font-semibold text-ink">
                        {tech.user.fullName}
                      </p>
                      {tech.isSenior && <SeniorBadge size="sm" />}
                      {tech.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success">
                          <ShieldCheck size={10} />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">{tech.title}</p>
                    <p className="text-xs text-muted">
                      {tech.user.phone}
                      {tech.user.city && ` · ${tech.user.city}`}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Registered {formatDate(tech.user.createdAt.toISOString())}
                    </p>
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

                {/* Details row */}
                <div className="border-t border-line px-4 py-3 flex flex-wrap gap-3 text-xs">
                  {tech.categories.length > 0 && (
                    <span className="text-muted">
                      Services:{" "}
                      <span className="text-ink font-medium">
                        {tech.categories.map((c) => c.name).join(", ")}
                      </span>
                    </span>
                  )}
                  <span className="text-muted">
                    Experience:{" "}
                    <span className="text-ink font-medium">
                      {tech.yearsExperience} yr{tech.yearsExperience !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="text-muted">
                    Starting price:{" "}
                    <span className="text-ink font-medium">
                      {tech.startingPrice} DT
                    </span>
                  </span>
                </div>

                {/* Documents row */}
                <div className="border-t border-line px-4 py-3 flex flex-wrap gap-3">
                  {tech.cinUrl ? (
                    
                    <a  href={tech.cinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand-orange hover:text-brand-orange transition-colors"
                    >
                      <FileText size={12} />
                      View CIN / Passport
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-danger-light px-3 py-1.5 text-xs text-danger">
                      CIN not uploaded
                    </span>
                  )}
                  {tech.diplomeUrl ? (
                    
                      <a href={tech.diplomeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand-orange hover:text-brand-orange transition-colors"
                    >
                      <FileText size={12} />
                      View Diploma
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-danger-light px-3 py-1.5 text-xs text-danger">
                      Diploma not uploaded
                    </span>
                  )}
                </div>

                {/* Plan selector + action buttons */}
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
                        onChange={(e) => {
                          /* handled via form below */
                        }}
                        className="rounded-lg border border-line px-2 py-1.5 text-xs outline-none focus:border-brand-orange bg-surface"
                      >
                        <option value="">— Select plan —</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </form>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-auto">
                    {accountStatus === "PENDING" && (
                      <>
                        <form
                          action={declineTechnicianAction.bind(null, tech.id)}
                        >
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
                        <form
                          action={approveTechnicianAction.bind(null, tech.id)}
                        >
                          <Button type="submit" size="sm">
                            <CheckCircle2 size={14} />
                            Approve
                          </Button>
                        </form>
                      </>
                    )}

                    {accountStatus === "ACTIVE" && (
                      <>
                        <form
                          action={archiveTechnicianAction.bind(null, tech.id)}
                        >
                          <Button type="submit" size="sm" variant="outline">
                            <Archive size={14} />
                            Archive
                          </Button>
                        </form>
                        <form
                          action={declineTechnicianAction.bind(null, tech.id)}
                        >
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
                      <form
                        action={approveTechnicianAction.bind(null, tech.id)}
                      >
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