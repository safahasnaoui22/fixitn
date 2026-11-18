"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { uploadFile } from "@/lib/cloudinary";
import {
  createPortfolioItem,
  deletePortfolioItem,
  getPortfolioCount,
} from "@/lib/db/portfolio";

const MAX_ITEMS = 20;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];

export async function uploadPortfolioItemAction(
  formData: FormData
): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const t = await getT();
  const err = (m: string) => `/t/portfolio?error=${encodeURIComponent(m)}`;
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    redirect(err(t("tech.portfolio.errSelect")));
  }

  // Check limit
  const count = await getPortfolioCount(technician.id);
  if (count >= MAX_ITEMS) {
    redirect(err(t("tech.portfolio.errMaxDelete", { n: MAX_ITEMS })));
  }

  const isImage = ACCEPTED_IMAGES.includes(file.type);
  const isVideo = ACCEPTED_VIDEOS.includes(file.type);

  if (!isImage && !isVideo) {
    redirect(err(t("tech.portfolio.errType")));
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const label = isVideo ? "50 MB" : "10 MB";
    redirect(err(t("tech.portfolio.errTooLarge", { size: label })));
  }

  const folder = isVideo ? "portfolio/videos" : "portfolio/images";
  const { url, publicId } = await uploadFile(file, folder);

  await createPortfolioItem({
    technicianId: technician.id,
    type: isVideo ? "VIDEO" : "IMAGE",
    url,
    publicId,
    caption,
  });

  revalidatePath("/t/portfolio");
  redirect("/t/portfolio?success=1");
}

export async function deletePortfolioItemAction(
  itemId: string
): Promise<void> {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  await deletePortfolioItem(itemId, technician.id);

  revalidatePath("/t/portfolio");
  revalidatePath(`/technician/${technician.id}`);
}

export async function savePortfolioItemAction(input: {
  url: string;
  publicId: string;
  type: "IMAGE" | "VIDEO";
  caption: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("TECHNICIAN");
  const t = await getT();
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) return { ok: false, error: t("tech.portfolio.errNoProfile") };

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (
    !cloud ||
    !input.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ||
    !input.publicId.startsWith("fixitn/portfolio/")
  ) {
    return { ok: false, error: t("tech.portfolio.errInvalidFile") };
  }
  if (input.type !== "IMAGE" && input.type !== "VIDEO") return { ok: false, error: t("tech.portfolio.errInvalidType") };

  const count = await getPortfolioCount(technician.id);
  if (count >= MAX_ITEMS) return { ok: false, error: t("tech.portfolio.errMax", { n: MAX_ITEMS }) };

  await createPortfolioItem({
    technicianId: technician.id,
    type: input.type,
    url: input.url,
    publicId: input.publicId,
    caption: input.caption.trim().slice(0, 120) || null,
  });
  revalidatePath("/t/portfolio");
  revalidatePath(`/technician/${technician.id}`);
  return { ok: true };
}
