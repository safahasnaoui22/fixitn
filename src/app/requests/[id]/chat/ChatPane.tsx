"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { formatTime } from "@/lib/utils";
import { sendMessageAction } from "./actions";
import type { MessageWithSender } from "@/lib/types";

export function ChatPane({
  requestId,
  messages,
  currentUserId,
}: {
  requestId: string;
  messages: MessageWithSender[];
  currentUserId: string;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll every 4s for new messages
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [router]);

  const boundAction = sendMessageAction.bind(null, requestId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">No messages yet — say hello!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {!isMe && (
                <Avatar src={msg.senderAvatarUrl} name={msg.senderFullName} size={28} className="shrink-0 mb-0.5" />
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {msg.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.imageUrl} alt="" className="rounded-2xl max-w-full" />
                )}
                {msg.body && (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMe
                        ? "bg-brand-orange text-white rounded-br-sm"
                        : "bg-surface-alt text-ink rounded-bl-sm"
                    }`}
                  >
                    {msg.body}
                  </div>
                )}
                <span className="text-[10px] text-muted">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        action={boundAction}
        className="shrink-0 flex items-center gap-2 border-t border-line bg-surface px-4 py-3"
      >
        <input
          name="body"
          type="text"
          required
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}