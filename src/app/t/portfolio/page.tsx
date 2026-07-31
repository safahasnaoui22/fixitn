import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listPortfolioItems } from "@/lib/db/portfolio";
import { TechBottomNav } from "@/components/TechBottomNav";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import {
  uploadPortfolioItemAction,
  deletePortfolioItemAction,
} from "./actions";

const MAX_ITEMS = 20;

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireRole("TECHNICIAN");
  const { error, success } = await searchParams;

  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const items = await listPortfolioItems(technician.id);
  const remaining = MAX_ITEMS - items.length;

  const images = items.filter((i) => i.type === "IMAGE");
  const videos = items.filter((i) => i.type === "VIDEO");

  return (
    <>
      <div className="app-content no-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Link
            href="/t/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-heading text-base font-semibold text-ink">
              My Portfolio
            </p>
            <p className="text-xs text-muted">
              {items.length}/{MAX_ITEMS} items
            </p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">
          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <p className="text-sm font-medium text-success">
                Item uploaded successfully!
              </p>
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {decodeURIComponent(error)}
            </p>
          )}

          {/* Upload form */}
          {remaining > 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="font-heading text-sm font-semibold text-ink mb-3">
                <Plus size={15} className="inline mr-1" />
                Add to Portfolio
              </p>
              <Suspense fallback={null}>
                <form
                  action={uploadPortfolioItemAction}
                  encType="multipart/form-data"
                  className="flex flex-col gap-3"
                >
                  <div>
                    <label className="text-sm font-medium text-ink">
                      File (image or video)
                    </label>
                    <input
                      name="file"
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                      className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-orange-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-orange-dark outline-none focus:border-brand-orange"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Images up to 10 MB · Videos up to 50 MB (MP4, MOV,
                      WebM)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink">
                      Caption (optional)
                    </label>
                    <input
                      name="caption"
                      type="text"
                      placeholder="e.g. AC repair completed in 1 hour"
                      maxLength={120}
                      className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
                    />
                  </div>
                  <Button type="submit" size="md">
                    <Upload size={16} />
                    Upload ({remaining} remaining)
                  </Button>
                </form>
              </Suspense>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You&apos;ve reached the {MAX_ITEMS}-item limit. Delete an item
              to upload a new one.
            </div>
          )}

          {/* Images section */}
          {images.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={15} className="text-muted" />
                <p className="font-heading text-sm font-semibold text-ink">
                  Photos ({images.length})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl overflow-hidden border border-line bg-surface group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.caption ?? "Portfolio image"}
                      className="h-36 w-full object-cover"
                    />
                    {item.caption && (
                      <p className="px-2 py-1.5 text-[11px] text-muted leading-snug line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="text-[10px] text-muted">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      <form
                        action={deletePortfolioItemAction.bind(null, item.id)}
                      >
                        <button
                          type="submit"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-light text-danger hover:bg-danger hover:text-white transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos section */}
          {videos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Video size={15} className="text-muted" />
                <p className="font-heading text-sm font-semibold text-ink">
                  Videos ({videos.length})
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {videos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-line bg-surface overflow-hidden"
                  >
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-56 object-cover bg-brand-navy"
                    />
                    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {item.caption && (
                          <p className="text-xs text-ink font-medium truncate">
                            {item.caption}
                          </p>
                        )}
                        <p className="text-[10px] text-muted mt-0.5">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                      <form
                        action={deletePortfolioItemAction.bind(null, item.id)}
                      >
                        <button
                          type="submit"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger hover:bg-danger hover:text-white transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
                <ImageIcon size={28} className="text-muted" />
              </div>
              <p className="font-heading text-base font-semibold text-ink">
                No portfolio items yet
              </p>
              <p className="text-sm text-muted max-w-xs">
                Upload photos and videos of your past work to attract more
                clients.
              </p>
            </div>
          )}
        </div>
      </div>
      <TechBottomNav />
    </>
  );
}