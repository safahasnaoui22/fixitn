"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { sendBroadcastAction } from "./actions";

export function BroadcastForm() {
  const t = useT();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(fd) => {
        const audience = String(fd.get("audience"));
        if (!window.confirm(t("adminOps.broadcast.confirm", { audience: t(`adminOps.broadcast.aud.${audience}`) }))) return;
        setMsg(null);
        start(async () => {
          const r = await sendBroadcastAction(fd);
          setMsg(
            r.ok
              ? { ok: true, text: t("adminOps.broadcast.sent", { n: r.sent ?? 0 }) }
              : { ok: false, text: r.error ?? t("adminOps.broadcast.couldNot") }
          );
        });
      }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <label className="text-xs font-semibold text-muted">{t("adminOps.broadcast.sendTo")}</label>
      <select
        name="audience"
        defaultValue="EVERYONE"
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink"
      >
        <option value="EVERYONE">{t("adminOps.broadcast.opt.EVERYONE")}</option>
        <option value="CLIENTS">{t("adminOps.broadcast.opt.CLIENTS")}</option>
        <option value="TECHNICIANS">{t("adminOps.broadcast.opt.TECHNICIANS")}</option>
        <option value="SENIORS">{t("adminOps.broadcast.opt.SENIORS")}</option>
      </select>
      <label className="text-xs font-semibold text-muted">{t("adminOps.broadcast.titleLabel")}</label>
      <input
        name="title"
        required
        maxLength={80}
        placeholder={t("adminOps.broadcast.titlePh")}
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
      />
      <label className="text-xs font-semibold text-muted">{t("adminOps.broadcast.messageLabel")}</label>
      <textarea
        name="body"
        required
        rows={3}
        maxLength={300}
        placeholder={t("adminOps.broadcast.messagePh")}
        className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-orange"
      />
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      <button
        disabled={pending}
        className="flex w-fit items-center gap-2 rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Send size={15} /> {pending ? t("adminOps.broadcast.sending") : t("adminOps.broadcast.send")}
      </button>
    </form>
  );
}
