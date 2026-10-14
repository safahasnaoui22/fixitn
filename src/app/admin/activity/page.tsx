import { requireRole } from "@/lib/auth";
import { listRecentAudit } from "@/lib/db/audit";
import { formatDate, formatTime } from "@/lib/utils";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string }>;
}) {
  await requireRole("ADMIN");
  const { who } = await searchParams;

  const all = await listRecentAudit(200);
  const rows = who === "sous" ? all.filter((r) => r.actorRole === "SOUS_ADMIN") : all;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Activity</h1>
        <p className="mt-0.5 text-sm text-muted">Latest changes made in the admin panel.</p>
      </div>

      <div className="flex gap-2">
        {[
          { href: "/admin/activity", label: "Everyone", on: who !== "sous" },
          { href: "/admin/activity?who=sous", label: "Sous-admins only", on: who === "sous" },
        ].map((t) => (
          <a
            key={t.href}
            href={t.href}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              t.on ? "bg-brand-orange text-white" : "border border-line bg-surface text-muted"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nothing yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <p className="min-w-0 flex-1 text-sm text-ink">{r.summary}</p>
            <p className="shrink-0 text-xs text-muted">
              <span
                className={`font-semibold ${
                  r.actorRole === "SOUS_ADMIN" ? "text-purple-600" : "text-ink"
                }`}
              >
                {r.actorRole === "SOUS_ADMIN" ? "sous-admin" : "admin"} {r.actorName}
              </span>{" "}
              · {formatDate(r.createdAt.toISOString())} {formatTime(r.createdAt.toISOString())}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
