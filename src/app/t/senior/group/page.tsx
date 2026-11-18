import Link from "next/link";
import { ArrowLeft, Lock, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { TechBottomNav } from "@/components/TechBottomNav";
import {
  countSeniorMembers,
  isActiveSenior,
  listSeniorMessages,
  markSeniorChatRead,
} from "@/lib/db/seniorChat";
import { SeniorChatPane } from "../SeniorChatPane";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SeniorGroupChatPage() {
  const session = await requireRole("TECHNICIAN");
  const t = await getT();
  const allowed = await isActiveSenior(session.userId);

  if (!allowed) {
    return (
      <>
        <div className="app-content no-scrollbar flex flex-col items-center gap-3 px-8 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
            <Lock size={28} className="text-muted" />
          </div>
          <p className="font-heading text-lg font-semibold text-ink">{t("tech.senior.title")}</p>
          <p className="text-sm text-muted">
            {t("tech.senior.restricted")}
          </p>
          <Link href="/t/messages" className="mt-2 text-sm font-semibold text-brand-orange">
            {t("tech.senior.backToMessages")}
          </Link>
        </div>
        <TechBottomNav />
      </>
    );
  }

  const [messages, members] = await Promise.all([listSeniorMessages(), countSeniorMembers()]);
  await markSeniorChatRead(session.userId);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col pb-[72px]">
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <Link
            href="/t/senior"
            aria-label={t("common.back")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-ink"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold text-ink">{t("tech.senior.title")}</p>
            <p className="text-xs text-muted">
              {t(members > 1 ? "tech.senior.groupSubMany" : "tech.senior.groupSubOne", { n: members })}
            </p>
          </div>
        </div>

        <SeniorChatPane myId={session.userId} messages={messages} />
      </div>
      <TechBottomNav />
    </>
  );
}
