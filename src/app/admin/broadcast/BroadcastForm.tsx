"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendBroadcastAction } from "./actions";

export function BroadcastForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(fd) => {
        const audience = String(fd.get("audience"));
        if (!window.confirm(`Send this message to ${audience.toLowerCase()} now?`)) return;
        setMsg(null);
        start(async () => {
          const r = await sendBroadcastAction(fd);
          setMsg(
            r.ok
              ? { ok: true, text: `Sent to ${r.sent} user(s).` }
              : { ok: false, text: r.error ?? "Could not send." }
          );
        });
      }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <label className="text-xs font-semibold text-muted">Send to</label>
      <select
        name="audience"
        defaultValue="EVERYONE"
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink"
      >
        <option value="EVERYONE">Everyone (clients + technicians)</option>
        <option value="CLIENTS">All clients</option>
        <option value="TECHNICIANS">All technicians</option>
        <option value="SENIORS">Senior technicians only</option>
      </select>
      <label className="text-xs font-semibold text-muted">Title</label>
      <input
        name="title"
        required
        maxLength={80}
        placeholder="New category added"
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
      />
      <label className="text-xs font-semibold text-muted">Message</label>
      <textarea
        name="body"
        required
        rows={3}
        maxLength={300}
        placeholder="Maintenance tonight from 02:00 to 03:00."
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
      />
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      <button
        disabled={pending}
        className="flex w-fit items-center gap-2 rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Send size={15} /> {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
