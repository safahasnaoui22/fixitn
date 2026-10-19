import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { getAttentionItems } from "@/lib/db/attention";

const TONE = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
} as const;

/** "Needs attention": everything the admin should do today, on one card. */
export async function AttentionBox() {
  const items = (await getAttentionItems(24)).filter((i) => i.count > 0);
  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {items.length === 0 ? (
          <CheckCircle2 size={18} className="text-emerald-600" />
        ) : (
          <AlertTriangle size={18} className="text-brand-orange" />
        )}
        <h2 className="font-heading text-base font-bold text-ink">
          {items.length === 0 ? "All clear — nothing needs attention" : "Needs attention"}
        </h2>
      </div>
      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((i) => (
            <Link
              key={i.key}
              href={i.href}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-brand-orange"
            >
              <span className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold ${TONE[i.tone]}`}>
                {i.count}
              </span>
              <span className="flex-1 text-sm text-ink">{i.label}</span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
