"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { sendClientDirectMessageAction } from "./actions";
import type { SupportMessage } from "@/lib/db/supportChat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatTime } from "@/lib/utils";
import { renderText } from "@/lib/i18n/translate";

export function DirectChatPane({
  myId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  initialMessages,
}: {
  myId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  initialMessages: SupportMessage[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [router]);

  const bound = sendClientDirectMessageAction.bind(null, otherUserId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 no-scrollbar">
        {initialMessages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            {t("client.chats.sendTo", { name: otherUserName })}
          </p>
        )}
        {initialMessages.map((msg) => {
          const isMe = msg.fromUserId === myId;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && <Avatar src={otherUserAvatar} name={otherUserName} size={28} className="shrink-0 mb-0.5" />}
              <div className={`max-w-[76%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "bg-brand-orange text-white rounded-ee-sm"
                      : "bg-surface-alt text-ink border border-line rounded-es-sm"
                  }`}
                >
                  {renderText(t, msg.body)}
                </div>
                <span className="text-[10px] text-muted px-1">
                  {formatTime(msg.createdAt, locale)}
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
          await bound(fd);
          formRef.current?.reset();
          router.refresh();
        }}
        className="shrink-0 flex items-center gap-2 border-t border-line px-4 py-3 bg-surface"
      >
        <input
          name="body"
          type="text"
          required
          autoComplete="off"
          placeholder={t("client.chats.writeTo", { name: otherUserName })}
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm outline-none focus:border-brand-orange text-ink"
        />
        <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <Send size={16} className="rtl:-scale-x-100" />
        </button>
      </form>
    </div>
  );
}
