import Link from "next/link";
import { Wrench, ShieldCheck } from "lucide-react";
import { listAdminTechnicians } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, formatDT } from "@/lib/utils";

export default async function AdminTechniciansPage() {
  const technicians = await listAdminTechnicians();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Technicians</h1>
        <p className="text-sm text-muted mt-0.5">{technicians.length} registered</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-line">
            <tr>
              {["Technician", "Title", "Plan", "Rating", "Jobs", "Price", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {technicians.map((t) => (
              <tr key={t.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={t.avatarUrl} name={t.fullName} size={32} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-ink">{t.fullName}</p>
                        {t.verified && <ShieldCheck size={13} className="text-success shrink-0" />}
                      </div>
                      {t.city && <p className="text-xs text-muted">{t.city}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{t.title}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    t.planKey?.startsWith("PRO") ? "bg-brand-orange-light text-brand-orange-dark" : "bg-surface-alt text-muted"
                  }`}>
                    {t.planKey === "PRO_MONTHLY" ? "Pro Monthly" : t.planKey === "PRO_YEARLY" ? "Pro Yearly" : "Free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{t.ratingAvg != null ? `${t.ratingAvg.toFixed(1)} (${t.ratingCount})` : "—"}</td>
                <td className="px-4 py-3 text-muted">{t.jobsCompleted}</td>
                <td className="px-4 py-3 text-muted">{formatDT(t.startingPrice)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/technicians/${t.id}`} className="text-xs font-semibold text-brand-orange hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {technicians.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Wrench size={28} className="text-muted" />
            <p className="text-sm text-muted">No technicians yet</p>
          </div>
        )}
      </div>
    </div>
  );
}