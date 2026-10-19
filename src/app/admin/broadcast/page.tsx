import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { formatDate, formatTime } from "@/lib/utils";
import { BroadcastForm } from "./BroadcastForm";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  await requireRole("ADMIN");
  const history = await prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 30 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Broadcast</h1>
        <p className="mt-0.5 text-sm text-muted">
          Send an in-app notification + push to a group. Users who installed the app get it on their phone.
        </p>
      </div>

      <BroadcastForm />

      <div>
        <h2 className="mb-2 font-heading text-lg font-bold text-ink">History</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {history.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nothing sent yet.</p>}
          {history.map((b) => (
            <div key={b.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{b.title}</p>
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-muted">
                  {b.audience} · {b.sentCount}
                </span>
                <p className="ml-auto text-xs text-muted">
                  {b.createdByName} · {formatDate(b.createdAt.toISOString())} {formatTime(b.createdAt.toISOString())}
                </p>
              </div>
              <p className="text-sm text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
