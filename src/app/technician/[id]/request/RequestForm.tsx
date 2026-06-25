"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { requestServiceAction } from "./actions";

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

      {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}

      <Field label="Full name" name="fullName" defaultValue={defaultFullName} required />
      <Field label="Phone number" name="phone" type="tel" defaultValue={defaultPhone} required />
      <Field label="Address" name="address" defaultValue={defaultAddress} required />

      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">
          Describe the problem
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="What's wrong? The more detail, the better the technician can prepare..."
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink">Photos (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-muted"
          >
            <Camera size={20} />
            <span className="text-[10px]">Add</span>
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

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Send Request
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
      />
    </div>
  );
}