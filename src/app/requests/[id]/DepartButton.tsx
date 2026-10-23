
"use client";

import { useState } from "react";
import { Navigation, Loader2, AlertCircle } from "lucide-react";
import { departAction } from "./actions";

export function DepartButton({ requestId }: { requestId: string }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDepart() {
    if (locating) return;

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    setError(null);

    const submitLocation = async (pos: GeolocationPosition) => {
      try {
        await departAction(
          requestId,
          pos.coords.latitude,
          pos.coords.longitude
        );
        // Normally, departAction redirects after success.
      } catch {
        setError("Could not start navigation. Please try again.");
        setLocating(false);
      }
    };

    const handleLocationError = (
      err: GeolocationPositionError
    ) => {
      setLocating(false);

      if (err.code === err.PERMISSION_DENIED) {
        setError(
          "Location access is blocked by your browser. Please allow location access for this website."
        );
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError(
          "Your location is temporarily unavailable. Check that Location Services are enabled and try again."
        );
      } else {
        setError(
          "Could not get your location. Please try again in an area with a better GPS or network signal."
        );
      }
    };

    navigator.geolocation.getCurrentPosition(
      submitLocation,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          handleLocationError(err);
          return;
        }

        // Retry using Wi-Fi or mobile network location.
        navigator.geolocation.getCurrentPosition(
          submitLocation,
          handleLocationError,
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
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
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-light px-3 py-2.5"
        >
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0 text-danger"
          />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        Your location is used only to calculate transport fees.
      </p>
    </div>
  );
}
