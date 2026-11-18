"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { savePortfolioItemAction } from "./actions";
import { useT } from "@/lib/i18n/I18nProvider";

const IMAGES = ["image/jpeg", "image/png", "image/webp"];
const VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;

export function PortfolioUploader({ remaining }: { remaining: number }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    const caption = (form.elements.namedItem("caption") as HTMLInputElement).value;
    if (!file) return setError(t("tech.portfolio.errSelect"));

    const isVideo = VIDEOS.includes(file.type);
    const isImage = IMAGES.includes(file.type);
    if (!isVideo && !isImage) return setError(t("tech.portfolio.errFormats"));
    if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE))
      return setError(isVideo ? t("tech.portfolio.errVideoLarge") : t("tech.portfolio.errPhotoLarge"));

    setBusy(true);
    setProgress(0);
    try {
      const signRes = await fetch("/api/portfolio/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: isVideo ? "video" : "image" }),
      });
      if (!signRes.ok) throw new Error(t("tech.portfolio.errStart"));
      const s = await signRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", s.apiKey);
      fd.append("timestamp", String(s.timestamp));
      fd.append("signature", s.signature);
      fd.append("folder", s.folder);

      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${s.cloudName}/${s.resourceType}/upload`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(json);
            else reject(new Error(json?.error?.message ?? t("tech.portfolio.errUpload")));
          } catch {
            reject(new Error(t("tech.portfolio.errUpload")));
          }
        };
        xhr.onerror = () => reject(new Error(t("tech.portfolio.errNetwork")));
        xhr.send(fd);
      });

      const saved = await savePortfolioItemAction({
        url: result.secure_url,
        publicId: result.public_id,
        type: isVideo ? "VIDEO" : "IMAGE",
        caption,
      });
      if (!saved.ok) throw new Error(saved.error ?? t("tech.portfolio.errSave"));
      form.reset();
      router.push("/t/portfolio?success=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tech.portfolio.errUpload"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium text-ink">{t("tech.portfolio.fileLabel")}</label>
        <input
          name="file"
          type="file"
          required
          disabled={busy}
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none focus:border-brand-orange"
        />
        <p className="mt-1 text-xs text-muted">{t("tech.portfolio.fileHint")}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-ink">{t("tech.portfolio.captionLabel")}</label>
        <input
          name="caption"
          type="text"
          maxLength={120}
          disabled={busy}
          placeholder={t("tech.portfolio.captionPlaceholder")}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
        />
      </div>
      {busy && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Upload size={16} />
        {busy ? t("tech.portfolio.uploading", { p: progress }) : t("tech.portfolio.uploadBtn", { n: remaining })}
      </button>
    </form>
  );
}
