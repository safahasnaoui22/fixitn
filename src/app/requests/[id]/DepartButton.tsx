"use client";

import { useState } from "react";
import { Navigation, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { departAction } from "./actions";

export function DepartButton({ requestId }: { requestId: string }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDepart() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await departAction(
            requestId,
            pos.coords.latitude,
            pos.coords.longitude
          );
          // departAction redirects, so we only reach here on error
        } catch {
          setError("Failed to start navigation. Please try again.");
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location access denied. Please allow location in your browser settings."
          );
        } else {
          setError("Could not get your location. Please try again.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDepart}
        disabled={locating}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {locating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Getting your location…
          </>
        ) : (
          <>
            <Navigation size={20} />
            Départ — Start Heading Over
          </>
        )}
      </button>
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-danger-light px-3 py-2.5">
          <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}
      <p className="text-center text-xs text-muted">
        Your location is used only to calculate transport fees
      </p>
    </div>
  );
}