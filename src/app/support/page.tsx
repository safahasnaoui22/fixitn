import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { SupportChat } from "./SupportChat";

export const dynamic = "force-dynamic";

/**
 * Support chat: the client or technician writes to the Admin / Sous-admin team.
 * Both staff roles share the same inbox (see /api/support/messages), so whoever
 * is free answers. A complaint ("Signaler") ends here so the person can keep
 * talking with the team instead of going back to the job page.
 */
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string; report?: string }>;
}) {
  const session = await requireUser();
  if (session.role === "ADMIN") redirect("/admin/support");
  if (session.role === "SOUS_ADMIN") redirect("/sous-admin/support");

  const { request, report } = await searchParams;
  const requestId = request && /^[a-z0-9]+$/i.test(request) ? request : null;

  const backHref =
    session.role === "TECHNICIAN"
      ? requestId
        ? `/requests/${requestId}`
        : "/t/messages"
      : requestId
        ? `/requests/${requestId}`
        : "/chats";

  return (
    <div className="app-content flex flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Link
          href={backHref}
          aria-label="Retour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <ShieldCheck size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold text-ink">Support Fixili</p>
          <p className="text-xs text-muted">Admin &amp; Sous-admin · écrivez-nous ici</p>
        </div>
      </div>

      {report && (
        <p className="shrink-0 border-b border-line bg-brand-orange-light px-4 py-2.5 text-xs text-brand-orange">
          Votre signalement a bien été envoyé. Vous pouvez continuer la discussion avec
          l&apos;équipe ci-dessous.
        </p>
      )}

      <SupportChat />
    </div>
  );
}
