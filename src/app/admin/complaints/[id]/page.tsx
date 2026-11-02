import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDateTime } from "@/lib/utils";
import { updateComplaintAction, moderateConversationAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Pending",
  INVESTIGATING: "Under review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};
const STATUS_CLS: Record<string, string> = {
  RESOLVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-surface-alt text-muted",
  INVESTIGATING: "bg-amber-50 text-amber-700",
  OPEN: "bg-red-50 text-red-700",
};

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("complaints");
  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) notFound();

  const [messages, restriction] = report.requestId
    ? await Promise.all([
        prisma.message.findMany({
          where: { requestId: report.requestId },
          orderBy: { createdAt: "asc" },
          take: 200,
          select: {
            id: true,
            body: true,
            imageUrl: true,
            createdAt: true,
            sender: { select: { fullName: true, role: true } },
          },
        }),
        prisma.chatRestriction.findUnique({
          where: { requestId: report.requestId },
          select: { active: true },
        }),
      ])
    : [[], null];
  const restricted = restriction?.active ?? false;

  // Admin and Sous-admin have their own support inbox (same shared conversations).
  const supportBase = session.role === "ADMIN" ? "/admin/support" : "/sous-admin/support";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/complaints"
          aria-label="Back to complaints"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold text-ink">{report.reason}</h1>
          <p className="text-xs text-muted">Submitted {formatDateTime(report.createdAt.toISOString())}</p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[report.status] ?? "bg-surface-alt text-muted"}`}>
          {STATUS_LABEL[report.status] ?? report.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Reported by</p>
          <p className="mt-1 font-semibold text-ink">{report.reporterName}</p>
          <Link
            href={`${supportBase}/${report.reporterId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
          >
            <MessageCircle size={13} /> Chat with {report.reporterName.split(" ")[0]}
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Reported user</p>
          <p className="mt-1 font-semibold text-ink">{report.reportedName ?? "Not specified"}</p>
          {report.reportedUserId && (
            <Link
              href={`${supportBase}/${report.reportedUserId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
            >
              <MessageCircle size={13} /> Chat with {(report.reportedName ?? "user").split(" ")[0]}
            </Link>
          )}
        </div>
      </div>

      {report.details && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Message to the moderators</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{report.details}</p>
        </div>
      )}

      {report.requestId && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Linked job</p>
            <Link
              href={`/admin/requests/${report.requestId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
            >
              Full job details (map, money, timeline) <ExternalLink size={12} />
            </Link>
          </div>

          <p className="mt-4 text-xs font-semibold text-muted">
            Job conversation ({messages.length} message{messages.length === 1 ? "" : "s"})
          </p>
          {messages.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No messages in the job chat.</p>
          ) : (
            <div className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-surface-alt p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">
                      {m.sender.fullName} <span className="font-normal text-muted">({m.sender.role})</span>
                    </p>
                    <p className="text-[10px] text-muted">{formatDateTime(m.createdAt.toISOString())}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
                    {m.body || (m.imageUrl ? "Image attachment" : "Empty message")}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form action={moderateConversationAction} className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
            <input type="hidden" name="requestId" value={report.requestId} />
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="mode" value={restricted ? "RESTORE" : "RESTRICT"} />
            <p className="mr-auto text-xs text-muted">
              Conversation:{" "}
              <span className={restricted ? "font-semibold text-red-600" : "font-semibold text-ink"}>
                {restricted ? "Messaging restricted" : "Messaging active"}
              </span>
            </p>
            <input name="reason" maxLength={1000} placeholder="Moderation note (optional)" className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink" />
            <button type="submit" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-brand-orange">
              {restricted ? "Restore messaging" : "Restrict messaging"}
            </button>
          </form>
        </div>
      )}

      <form action={updateComplaintAction} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <input type="hidden" name="reportId" value={report.id} />
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Status
          <select name="status" defaultValue={report.status} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink">
            <option value="OPEN">Pending</option>
            <option value="INVESTIGATING">Under review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Admin note (internal)
          <textarea name="adminNote" defaultValue={report.adminNote ?? ""} maxLength={3000} rows={3} placeholder="Add internal investigation notes..." className="resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink" />
        </label>
        <button type="submit" className="rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white">
          Save complaint
        </button>
      </form>
    </div>
  );
}
