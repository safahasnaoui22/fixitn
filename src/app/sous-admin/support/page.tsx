"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, HeadphonesIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  fromUserId: string;
  body: string;
  createdAt: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  fromUserRole: string;
}

export default function SupportChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages
  async function loadMessages() {
    try {
      const res = await fetch("/api/support/messages");
      if (res.status === 401) { router.replace("/login"); return; }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setMyUserId(data.myUserId ?? null);
    } catch {
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setBody("");
        await loadMessages();
        inputRef.current?.focus();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-content flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 shrink-0 bg-surface">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange-light">
          <HeadphonesIcon size={18} className="text-brand-orange" />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-ink">
            Support Fixili
          </p>
          <p className="text-xs text-muted">
            Notre équipe vous répond rapidement
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 no-scrollbar">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-muted animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-danger">{error}</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-light">
              <HeadphonesIcon size={28} className="text-brand-orange" />
            </div>
            <p className="font-heading text-base font-semibold text-ink">
              Comment pouvons-nous vous aider ?
            </p>
            <p className="text-sm text-muted max-w-xs">
              Décrivez votre problème ou posez votre question.
              Notre équipe vous répondra dans les plus brefs délais.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.fromUserId === myUserId;
          const isSupport = ["ADMIN", "SOUS_ADMIN"].includes(msg.fromUserRole);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar for support */}
              {!isMe && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange-light mb-0.5">
                  <HeadphonesIcon size={12} className="text-brand-orange" />
                </div>
              )}

              <div className={`max-w-[78%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && isSupport && (
                  <p className="text-[10px] text-brand-orange font-semibold px-1">
                    Support Fixili
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe
                    ? "bg-brand-orange text-white rounded-br-sm"
                    : "bg-surface-alt text-ink rounded-bl-sm border border-line"
                }`}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-muted px-1">
                  {new Date(msg.createdAt).toLocaleTimeString("fr-TN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="shrink-0 flex items-center gap-2 border-t border-line px-4 py-3 bg-surface"
      >
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white disabled:opacity-40 transition-opacity"
        >
          {sending
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />
          }
        </button>
      </form>
    </div>
  );
}