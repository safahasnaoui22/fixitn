
"use client";

import { useState } from "react";
import { Navigation, Loader2, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { departAction } from "./actions";

export function DepartButton({ requestId }: { requestId: string }) {
  const t = useT();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDepart() {
    if (locating) return;

    if (!navigator.geolocation) {
      setError(t("booking.depart.noGeo"));
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
        setError(t("booking.depart.startFail"));
        setLocating(false);
      }
    };

    const handleLocationError = (
      err: GeolocationPositionError
    ) => {
      setLocating(false);

      if (err.code === err.PERMISSION_DENIED) {
        setError(
          t("booking.depart.denied")
        );
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError(
          t("booking.depart.unavailable")
        );
      } else {
        setError(
          t("booking.depart.failed")
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
            {t("booking.depart.locating")}
          </>
        ) : (
          <>
            <Navigation size={20} />
            {t("booking.depart.start")}
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
        {t("booking.depart.privacy")}
      </p>
    </div>
  );
}
