import { Flag, MessageSquareWarning } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { updateComplaintAction, moderateConversationAction } from "./actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  OPEN: "Pending",
  INVESTIGATING: "Under review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export default async function ComplaintsPage() {
  await requirePermission("complaints");
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const requestIds = [...new Set(reports.map((r) => r.requestId).filter((id): id is string => Boolean(id)))];
  const chatMessages = requestIds.length
    ? await prisma.message.findMany({
        where: { requestId: { in: requestIds } },
        select: {
          id: true,
          requestId: true,
          body: true,
          imageUrl: true,
          createdAt: true,
          sender: { select: { fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      })
    : [];
  const restrictions = requestIds.length
    ? await prisma.chatRestriction.findMany({
        where: { requestId: { in: requestIds }, active: true },
        select: { requestId: true },
      })
    : [];
  const restrictedRequests = new Set(restrictions.map((r) => r.requestId));

  const messagesByRequest = new Map<string, typeof chatMessages>();
  for (const message of chatMessages) {
    const existing = messagesByRequest.get(message.requestId) ?? [];
    if (existing.length < 30) existing.push(message);
    messagesByRequest.set(message.requestId, existing);
  }

  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const reviewingCount = reports.filter((r) => r.status === "INVESTIGATING").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Flag size={22} className="text-brand-orange" />
          <h1 className="font-heading text-2xl font-bold text-ink">Chat complaints</h1>
        </div>
        <p className="mt-1 text-sm text-muted">Review reports submitted by clients and technicians. Only authorized admin staff can access this page.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          ["Total complaints", reports.length],
          ["Pending", openCount],
          ["Under review", reviewingCount],
        ].map(([label, count]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-ink">{count}</p>
          </div>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <MessageSquareWarning size={28} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold text-ink">No complaints yet</p>
          <p className="mt-1 text-sm text-muted">New chat complaints will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => {
            const requestMessages = report.requestId
              ? [...(messagesByRequest.get(report.requestId) ?? [])].reverse()
              : [];
            return (
              <article key={report.id} className="rounded-2xl border border-line bg-surface p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{report.reason}</p>
                    <p className="mt-1 text-xs text-muted">
                      Submitted {report.createdAt.toLocaleString()} · {report.requestId ? `Request ${report.requestId}` : "No linked request"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    report.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" :
                    report.status === "REJECTED" ? "bg-surface-alt text-muted" :
                    report.status === "INVESTIGATING" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>{statusLabel[report.status] ?? report.status}</span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-alt p-3">
                    <p className="text-xs text-muted">Reported by</p>
                    <p className="mt-1 font-medium text-ink">{report.reporterName}</p>
                  </div>
                  <div className="rounded-xl bg-surface-alt p-3">
                    <p className="text-xs text-muted">Reported user</p>
                    <p className="mt-1 font-medium text-ink">{report.reportedName ?? "Not specified"}</p>
                  </div>
                </div>

                {report.details && <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{report.details}</p>}
                {requestMessages.length > 0 && (
                  <details className="mt-3 rounded-xl border border-line p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-ink">Review conversation ({requestMessages.length} recent messages)</summary>
                    <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
                      {requestMessages.map((message) => (
                        <div key={message.id} className="rounded-lg bg-surface-alt p-3">
                          <div className="flex flex-wrap justify-between gap-2">
                            <p className="text-xs font-semibold text-ink">{message.sender.fullName} <span className="font-normal text-muted">({message.sender.role})</span></p>
                            <p className="text-[10px] text-muted">{message.createdAt.toLocaleString()}</p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{message.body || (message.imageUrl ? "Image attachment" : "Empty message")}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {report.requestId && (
                  <form action={moderateConversationAction} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
                    <input type="hidden" name="requestId" value={report.requestId} />
                    <input type="hidden" name="mode" value={restrictedRequests.has(report.requestId) ? "RESTORE" : "RESTRICT"} />
                    <p className="mr-auto text-xs text-muted">
                      Conversation: <span className={restrictedRequests.has(report.requestId) ? "font-semibold text-red-600" : "font-semibold text-ink"}>{restrictedRequests.has(report.requestId) ? "Messaging restricted" : "Messaging active"}</span>
                    </p>
                    <input name="reason" maxLength={1000} placeholder="Moderation note (optional)" className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink" />
                    <button type="submit" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-brand-orange">
                      {restrictedRequests.has(report.requestId) ? "Restore messaging" : "Restrict messaging"}
                    </button>
                  </form>
                )}

                <form action={updateComplaintAction} className="mt-4 grid gap-3 border-t border-line pt-4">
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
                    <textarea name="adminNote" defaultValue={report.adminNote ?? ""} maxLength={3000} rows={2} placeholder="Add internal investigation notes..." className="resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink" />
                  </label>
                  <button type="submit" className="rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white">Save complaint</button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
