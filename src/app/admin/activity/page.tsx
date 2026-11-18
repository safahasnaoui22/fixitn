import { requireRole } from "@/lib/auth";
import { listRecentAudit } from "@/lib/db/audit";
import { formatDate, formatTime } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { renderText } from "@/lib/i18n/translate";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string }>;
}) {
  await requireRole("ADMIN");
  const t = await getT();
  const locale = await getLocale();
  const { who } = await searchParams;

  const all = await listRecentAudit(200);
  const rows = who === "sous" ? all.filter((r) => r.actorRole === "SOUS_ADMIN") : all;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{t("adminOps.activity.title")}</h1>
        <p className="mt-0.5 text-sm text-muted">{t("adminOps.activity.subtitle")}</p>
      </div>

      <div className="flex gap-2">
        {[
          { href: "/admin/activity", label: t("adminOps.activity.everyone"), on: who !== "sous" },
          { href: "/admin/activity?who=sous", label: t("adminOps.activity.sousOnly"), on: who === "sous" },
        ].map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab.on ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.length === 0 && <p className="px-4 py-6 text-sm text-muted">{t("adminOps.activity.nothing")}</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <p className="min-w-0 flex-1 text-sm text-ink">{renderText(t, r.summary)}</p>
            <p className="shrink-0 text-xs text-muted">
              <span
                className={`font-semibold ${
                  r.actorRole === "SOUS_ADMIN" ? "text-purple-600" : "text-ink"
                }`}
              >
                {t(r.actorRole === "SOUS_ADMIN" ? "adminOps.activity.bySous" : "adminOps.activity.byAdmin", { name: r.actorName })}
              </span>{" "}
              · {formatDate(r.createdAt.toISOString(), locale)} {formatTime(r.createdAt.toISOString(), locale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
