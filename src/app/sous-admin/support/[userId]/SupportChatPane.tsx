"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { formatTime } from "@/lib/utils";
import { sendSupportMessageAction } from "./actions";
import type { SupportMessage } from "@/lib/db/supportChat";

export function SupportChatPane({
  sousAdminId,
  otherUserId,
  otherUserName,
  initialMessages,
}: {
  sousAdminId: string;
  otherUserId: string;
  otherUserName: string;
  initialMessages: SupportMessage[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  // Poll every 4s for new messages
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [router]);

  const boundAction = sendSupportMessageAction.bind(null, sousAdminId, otherUserId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-b-2xl border border-t-0 border-line bg-surface">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
        {initialMessages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">
            No messages yet — start the conversation below.
          </p>
        )}

        {initialMessages.map((msg) => {
          const isMe = msg.fromUserId === sousAdminId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {!isMe && (
                <Avatar
                  src={msg.fromUserAvatar}
                  name={msg.fromUserName}
                  size={28}
                  className="shrink-0 mb-0.5"
                />
              )}
              <div
                className={`max-w-[75%] flex flex-col gap-1 ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] text-muted px-1">
                    {msg.fromUserName}
                  </p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "bg-brand-navy text-white rounded-br-sm"
                      : "bg-surface-alt text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] text-muted px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        action={boundAction}
        className="shrink-0 flex items-center gap-2 border-t border-line px-4 py-3"
      >
        <input
          name="body"
          type="text"
          required
          placeholder={`Reply to ${otherUserName}…`}
          autoComplete="off"
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm outline-none focus:border-brand-navy"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-white disabled:opacity-50 transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}