import { formatDate, formatTime } from "@/lib/utils";
import type { LastChange } from "@/lib/db/audit";
import { getT, getLocale } from "@/lib/i18n/server";
import { renderText } from "@/lib/i18n/translate";

/** Small "Modified by …" line shown under an item that an admin / sous-admin changed. */
export async function ModifiedBy({ change }: { change: LastChange | undefined | null }) {
  if (!change) return null;
  const t = await getT();
  const locale = await getLocale();
  const isSous = change.actorRole === "SOUS_ADMIN";
  const when = `${formatDate(change.createdAt.toISOString(), locale)} · ${formatTime(change.createdAt.toISOString(), locale)}`;
  return (
    <p className="mt-1 text-[11px] text-muted">
      {renderText(t, change.summary)} —{" "}
      <span className={isSous ? "font-semibold text-purple-600" : "font-semibold text-ink"}>
        {t(isSous ? "comp.modified.bySous" : "comp.modified.byAdmin", { name: change.actorName })}
      </span>{" "}
      · {when}
    </p>
  );
}
