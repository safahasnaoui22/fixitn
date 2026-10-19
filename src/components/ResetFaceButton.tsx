"use client";

import { useTransition } from "react";
import { ScanFace } from "lucide-react";
import { resetFaceAction } from "@/app/admin/security/actions";

/** "Reset face" with a confirmation. The person is signed out everywhere and must enrol again. */
export function ResetFaceButton({ userId, name }: { userId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Reset the face of ${name}?\n\nThey will be signed out everywhere and must register their face again at the next login.`
          )
        )
          return;
        start(async () => {
          await resetFaceAction(userId);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-orange hover:text-brand-orange disabled:opacity-50"
    >
      <ScanFace size={13} />
      {pending ? "Resetting…" : "Reset face"}
    </button>
  );
}
