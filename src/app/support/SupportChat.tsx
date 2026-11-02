"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

type Msg = {
  id: string;
  fromUserId: string;
  body: string;
  createdAt: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  fromUserRole: string;
};

const STAFF_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  SOUS_ADMIN: "Support",
};

/** Live chat with the Admin / Sous-admin team (polls /api/support/messages). */
export function SupportChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/support/messages", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMyId(data.myUserId);
      setMessages(data.messages);
      setLoaded(true);
    } catch {
      /* network hiccup: next tick retries */
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 4000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Message non envoyé.");
      } else {
        setText("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {loaded && messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            Écrivez votre message : un administrateur ou le support vous répondra ici.
          </p>
        )}

        {messages.map((m) => {
          const isMe = m.fromUserId === myId;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <Avatar src={m.fromUserAvatar} name={m.fromUserName} size={28} className="mb-0.5 shrink-0" />
              )}
              <div className={`flex max-w-[78%] flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="px-1 text-[11px] font-semibold text-brand-orange">
                    {m.fromUserName} · {STAFF_LABEL[m.fromUserRole] ?? m.fromUserRole}
                  </span>
                )}
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "rounded-br-sm bg-brand-orange text-white"
                      : "rounded-bl-sm border border-line bg-surface-alt text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <span className="px-1 text-[10px] text-muted">
                  {new Date(m.createdAt).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="shrink-0 px-4 pb-1 text-xs text-danger">{error}</p>}

      <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-line bg-surface px-4 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoComplete="off"
          placeholder="Écrire à l'équipe Fixili…"
          className="flex-1 rounded-full border border-line bg-surface-alt px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Envoyer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
