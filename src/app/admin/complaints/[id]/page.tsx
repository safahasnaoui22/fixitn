import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDateTime } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { tDb } from "@/lib/i18n/translate";
import { updateComplaintAction, moderateConversationAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"];
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
  const t = await getT();
  const locale = await getLocale();
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
          aria-label={t("adminSup.complaints.backAria")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold text-ink">{tDb(t, "reportReason", report.reason)}</h1>
          <p className="text-xs text-muted">{t("adminSup.complaints.submitted", { date: formatDateTime(report.createdAt.toISOString(), locale) })}</p>
        </div>
        <span className={`ms-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[report.status] ?? "bg-surface-alt text-muted"}`}>
          {STATUSES.includes(report.status) ? t(`adminSup.complaints.status.${report.status}`) : report.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminSup.complaints.reportedBy")}</p>
          <p className="mt-1 font-semibold text-ink">{report.reporterName}</p>
          <Link
            href={`${supportBase}/${report.reporterId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
          >
            <MessageCircle size={13} /> {t("adminSup.complaints.chatWith", { name: report.reporterName.split(" ")[0] })}
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminSup.complaints.reportedUser")}</p>
          <p className="mt-1 font-semibold text-ink">{report.reportedName ?? t("adminSup.complaints.notSpecified")}</p>
          {report.reportedUserId && (
            <Link
              href={`${supportBase}/${report.reportedUserId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
            >
              <MessageCircle size={13} /> {t("adminSup.complaints.chatWith", { name: (report.reportedName ?? t("adminSup.complaints.defaultUser")).split(" ")[0] })}
            </Link>
          )}
        </div>
      </div>

      {report.details && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t("adminSup.complaints.msgToModerators")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{report.details}</p>
        </div>
      )}

      {report.requestId && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{t("adminSup.complaints.linkedJob")}</p>
            <Link
              href={`/admin/requests/${report.requestId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:underline"
            >
              {t("adminSup.complaints.fullJob")} <ExternalLink size={12} />
            </Link>
          </div>

          <p className="mt-4 text-xs font-semibold text-muted">
            {t(messages.length === 1 ? "adminSup.complaints.convOne" : "adminSup.complaints.convMany", { n: messages.length })}
          </p>
          {messages.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("adminSup.complaints.noJobMessages")}</p>
          ) : (
            <div className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-surface-alt p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">
                      {m.sender.fullName} <span className="font-normal text-muted">({t(`role.${m.sender.role}`)})</span>
                    </p>
                    <p className="text-[10px] text-muted">{formatDateTime(m.createdAt.toISOString(), locale)}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
                    {m.body || (m.imageUrl ? t("adminSup.complaints.imageAttachment") : t("adminSup.complaints.emptyMessage"))}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form action={moderateConversationAction} className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
            <input type="hidden" name="requestId" value={report.requestId} />
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="mode" value={restricted ? "RESTORE" : "RESTRICT"} />
            <p className="me-auto text-xs text-muted">
              {t("adminSup.complaints.conversation")}{" "}
              <span className={restricted ? "font-semibold text-red-600" : "font-semibold text-ink"}>
                {restricted ? t("adminSup.complaints.restricted") : t("adminSup.complaints.active")}
              </span>
            </p>
            <input name="reason" maxLength={1000} placeholder={t("adminSup.complaints.notePlaceholder")} className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink" />
            <button type="submit" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-brand-orange">
              {restricted ? t("adminSup.complaints.restore") : t("adminSup.complaints.restrict")}
            </button>
          </form>
        </div>
      )}

      <form action={updateComplaintAction} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <input type="hidden" name="reportId" value={report.id} />
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t("adminSup.complaints.statusLabel")}
          <select name="status" defaultValue={report.status} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`adminSup.complaints.status.${s}`)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t("adminSup.complaints.adminNote")}
          <textarea name="adminNote" defaultValue={report.adminNote ?? ""} maxLength={3000} rows={3} placeholder={t("adminSup.complaints.notePlaceholder2")} className="resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink" />
        </label>
        <button type="submit" className="rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white">
          {t("adminSup.complaints.save")}
        </button>
      </form>
    </div>
  );
}
