"use client";

import { useState, useTransition } from "react";
import { Flag, CheckCircle2, X } from "lucide-react";
import { createUserReportAction } from "@/app/report/actions";
import { REPORT_REASONS } from "@/lib/reportReasons";

/**
 * "Signaler" button (like on social networks). Opens a small sheet: reason + a written
 * message. The report goes to the admin and sous-admin complaints queue.
 * Works for a client reporting a technician and a technician reporting a client.
 */
export function ReportUserButton({
  reportedUserId,
  reportedName,
  requestId,
  variant = "dark",
  label = "Signaler",
}: {
  reportedUserId: string;
  reportedName: string;
  requestId?: string;
  variant?: "dark" | "light";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dark = variant === "dark";

  function close() {
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
          dark
            ? "border border-white/20 text-white/70 hover:text-white"
            : "border border-line text-muted hover:text-danger"
        }`}
      >
        <Flag size={13} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#121C26] p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-heading text-base font-bold">Signaler {reportedName}</p>
              <button onClick={close} aria-label="Close" className="text-white/60">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <p className="text-sm text-white/80">
                  Report sent. Our moderators will look at it and may contact you.
                </p>
                <button
                  onClick={close}
                  className="rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white"
                >
                  OK
                </button>
              </div>
            ) : (
              <form
                action={(fd) => {
                  setError(null);
                  start(async () => {
                    const r = await createUserReportAction(fd);
                    if (r.ok) setDone(true);
                    else setError(r.error ?? "Something went wrong.");
                  });
                }}
                className="mt-4 flex flex-col gap-3"
              >
                <input type="hidden" name="reportedUserId" value={reportedUserId} />
                {requestId && <input type="hidden" name="requestId" value={requestId} />}

                <select
                  name="reason"
                  required
                  defaultValue=""
                  className="rounded-xl border border-white/15 bg-[#0F1821] px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="" disabled>
                    Why are you reporting this person?
                  </option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <textarea
                  name="message"
                  required
                  minLength={5}
                  rows={4}
                  maxLength={1500}
                  placeholder="Write your message to the moderators: what happened?"
                  className="rounded-xl border border-white/15 bg-[#0F1821] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                />

                {error && <p className="text-xs text-red-300">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Send report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
