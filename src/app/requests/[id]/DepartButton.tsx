"use client";

import { useState } from "react";
import { Navigation, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { departAction } from "./actions";

export function DepartButton({ requestId }: { requestId: string }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function handleDepart() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    setLocating(true);
    setError(null);

    const onSuccess = async (pos: GeolocationPosition) => {
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
    };

    const onFail = (err: GeolocationPositionError) => {
      setLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        setDenied(true);
        setError(
          "Location access is blocked for this website. Follow the steps below, then press the button again."
        );
      } else {
        setError(
          "Could not get your position (weak GPS/network). Move near a window or turn on Wi-Fi, then try again."
        );
      }
    };

    // 1st try: high accuracy (GPS). If it is unavailable / times out,
    // 2nd try: low accuracy (Wi-Fi / cell towers) which works indoors.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) return onFail(err);
        navigator.geolocation.getCurrentPosition(onSuccess, onFail, {
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 60000,
        });
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
      {denied && (
        <div className="rounded-xl border border-line bg-surface-alt px-3 py-3 text-xs text-ink leading-relaxed">
          <p className="font-semibold mb-1">iPhone (Safari)</p>
          <p className="mb-2">
            1. Settings → Privacy &amp; Security → Location Services → ON, then
            Safari Websites → &quot;While Using the App&quot;.
            <br />
            2. In Safari tap <b>aA</b> (address bar) → Website Settings →
            Location → <b>Allow</b>. Reload the page.
          </p>
          <p className="font-semibold mb-1">Android (Chrome)</p>
          <p>
            Tap the lock icon next to the address → Permissions → Location →
            <b> Allow</b>. Reload the page.
          </p>
        </div>
      )}
      <p className="text-center text-xs text-muted">
        Your location is used only to calculate transport fees
      </p>
    </div>
  );
}