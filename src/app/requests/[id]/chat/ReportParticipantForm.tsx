"use client";

import { ReportUserButton } from "@/components/ReportUserButton";

/** Report the other person of this conversation (goes to admin + sous-admin complaints). */
export function ReportParticipantForm({
  requestId,
  reportedUserId,
  reportedName,
}: {
  requestId: string;
  reportedUserId: string;
  reportedName: string;
}) {
  return (
    <div className="flex shrink-0 justify-end border-t border-line bg-surface px-4 py-2">
      <ReportUserButton
        reportedUserId={reportedUserId}
        reportedName={reportedName}
        requestId={requestId}
        variant="light"
      />
    </div>
  );
}
