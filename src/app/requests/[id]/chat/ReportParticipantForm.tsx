"use client";

import { Flag } from "lucide-react";
import { reportChatParticipantAction } from "./actions";

export function ReportParticipantForm({ requestId }: { requestId: string }) {
  const action = reportChatParticipantAction.bind(null, requestId);

  return (
    <details className="shrink-0 border-t border-line bg-surface px-4 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-end gap-1.5 text-xs font-medium text-muted hover:text-danger">
        <Flag size={14} />
        Report participant
      </summary>
      <form action={action} className="mt-3 flex flex-col gap-2">
        <label className="text-xs font-medium text-ink" htmlFor={`report-reason-${requestId}`}>
          Why are you reporting this person?
        </label>
        <select
          id={`report-reason-${requestId}`}
          name="reason"
          required
          defaultValue=""
          className="w-full rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-danger"
        >
          <option value="" disabled>Choose a reason</option>
          <option>Harassment or bullying</option>
          <option>Scam or fraud</option>
          <option>Inappropriate messages</option>
          <option>Threats or unsafe behavior</option>
          <option>Other</option>
        </select>
        <textarea
          name="details"
          rows={2}
          maxLength={1000}
          placeholder="Add details (optional)"
          className="w-full resize-y rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-danger"
        />
        <button
          type="submit"
          className="self-end rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Send report to moderation
        </button>
      </form>
    </details>
  );
}
