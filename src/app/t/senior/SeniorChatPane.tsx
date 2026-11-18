"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { sendSeniorMessageAction } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { renderText } from "@/lib/i18n/translate";
import { formatTime } from "@/lib/utils";
import type { SeniorChatMessage } from "@/lib/db/seniorChat";

export function SeniorChatPane({
  myId,
  messages,
}: {
  myId: string;
  messages: SeniorChatMessage[];
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // New messages appear by themselves (refresh every 4 s while the tab is visible)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-semibold text-ink">{t("tech.senior.noMessages")}</p>
            <p className="max-w-xs text-xs text-muted">
              {t("tech.senior.noMessagesHint")}
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === myId;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <Avatar src={m.senderAvatar} name={m.senderName} size={28} className="mb-0.5 shrink-0" />
              )}
              <div className={`flex max-w-[78%] flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="px-1 text-[11px] font-semibold text-brand-orange">{m.senderName}</span>
                )}
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "rounded-ee-sm bg-brand-orange text-white"
                      : "rounded-es-sm border border-line bg-surface-alt text-ink"
                  }`}
                >
                  {renderText(t, m.body)}
                </div>
                <span className="px-1 text-[10px] text-muted">
                  {formatTime(m.createdAt, locale)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={async (fd) => {
          await sendSeniorMessageAction(fd);
          formRef.current?.reset();
          router.refresh();
        }}
        className="flex shrink-0 items-center gap-2 border-t border-line bg-surface px-4 py-3"
      >
        <input
          name="body"
          type="text"
          required
          maxLength={1000}
          autoComplete="off"
          placeholder={t("tech.senior.inputPlaceholder")}
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          aria-label={t("common.send")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white"
        >
          <Send size={16} className="rtl:-scale-x-100" />
        </button>
      </form>
    </div>
  );
}
