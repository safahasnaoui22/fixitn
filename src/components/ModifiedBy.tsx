import { formatDate, formatTime } from "@/lib/utils";
import type { LastChange } from "@/lib/db/audit";

/** Small "Modified by …" line shown under an item that an admin / sous-admin changed. */
export function ModifiedBy({ change }: { change: LastChange | undefined | null }) {
  if (!change) return null;
  const isSous = change.actorRole === "SOUS_ADMIN";
  const when = `${formatDate(change.createdAt.toISOString())} · ${formatTime(change.createdAt.toISOString())}`;
  return (
    <p className="mt-1 text-[11px] text-muted">
      {change.summary} —{" "}
      <span className={isSous ? "font-semibold text-purple-600" : "font-semibold text-ink"}>
        modified by {isSous ? "sous-admin" : "admin"} {change.actorName}
      </span>{" "}
      · {when}
    </p>
  );
}
