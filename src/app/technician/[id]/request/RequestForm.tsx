"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
import { NAVY_ROW, NAVY_TILE, ORANGE } from "@/lib/theme";
import { requestServiceAction } from "./actions";
import { useT } from "@/lib/i18n/I18nProvider";

interface RequestFormProps {
  technicianId: string;
  categoryId: string;
  defaultFullName: string;
  defaultPhone: string;
  defaultAddress: string;
}

export function RequestForm({
  technicianId,
  categoryId,
  defaultFullName,
  defaultPhone,
  defaultAddress,
}: RequestFormProps) {
  const t = useT();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {
        /* denied or unavailable — the request still works without coordinates */
      },
      { timeout: 5000 }
    );
  }, []);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  return (
    <form action={requestServiceAction} className="flex flex-col gap-4">
      <input type="hidden" name="technicianId" value={technicianId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      {coords && (
        <>
          <input type="hidden" name="latitude" value={coords.latitude} />
          <input type="hidden" name="longitude" value={coords.longitude} />
        </>
      )}

      {error && <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>}

      <Field label={t("client.request.fullName")} name="fullName" defaultValue={defaultFullName} required />
      <Field label={t("client.request.phone")} name="phone" type="tel" dir="ltr" defaultValue={defaultPhone} required />
      <Field label={t("client.request.address")} name="address" defaultValue={defaultAddress} required />

      <div>
        <label htmlFor="description" className="text-sm font-medium text-white">
          {t("client.request.describe")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder={t("client.request.describePlaceholder")}
          className="mt-1.5 w-full rounded-xl border border-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-brand-orange"
          style={{ backgroundColor: NAVY_ROW }}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-white">{t("client.request.photos")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/25 text-white/60"
            style={{ backgroundColor: NAVY_TILE }}
          >
            <Camera size={20} />
            <span className="text-[10px]">{t("client.request.addPhoto")}</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </div>

      <button
        type="submit"
        className="mt-2 w-full rounded-xl py-3.5 text-[15px] font-semibold text-white"
        style={{ backgroundColor: ORANGE }}
      >
        {t("client.request.send")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-white">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        dir={dir}
        className="mt-1.5 w-full rounded-xl border border-white/10 px-4 py-3 text-[15px] text-start text-white placeholder:text-white/40 outline-none focus:border-brand-orange"
          style={{ backgroundColor: NAVY_ROW }}
      />
    </div>
  );
}