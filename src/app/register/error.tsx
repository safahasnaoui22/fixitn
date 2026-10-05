"use client";

import { useEffect } from "react";
import Link from "next/link";

// Without an error boundary, any crash on /register shows a blank white page.
export default function RegisterError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[register] crashed:", error);
  }, [error]);

  return (
    <div className="app-content px-6 py-10 text-center">
      <h2 className="font-heading text-lg font-bold text-ink">Une erreur est survenue</h2>
      <p className="mt-2 text-sm text-muted">
        Le formulaire n&apos;a pas pu être envoyé. Vérifiez que chaque document fait
        moins de 1,8 Mo, puis réessayez.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-6 h-12 w-full rounded-xl bg-brand-orange px-5 text-[15px] font-semibold text-white"
      >
        Réessayer
      </button>
      <Link href="/onboarding" className="mt-4 block text-sm text-muted">
        &larr; Retour
      </Link>
    </div>
  );
}