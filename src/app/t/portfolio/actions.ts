"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
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
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    redirect("/t/portfolio?error=Please+select+a+file+to+upload.");
  }

  // Check limit
  const count = await getPortfolioCount(technician.id);
  if (count >= MAX_ITEMS) {
    redirect(
      `/t/portfolio?error=Maximum+${MAX_ITEMS}+items+allowed.+Delete+some+before+uploading+more.`
    );
  }

  const isImage = ACCEPTED_IMAGES.includes(file.type);
  const isVideo = ACCEPTED_VIDEOS.includes(file.type);

  if (!isImage && !isVideo) {
    redirect(
      "/t/portfolio?error=Unsupported+file+type.+Use+JPG,+PNG,+WebP,+MP4,+or+MOV."
    );
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const label = isVideo ? "50 MB" : "10 MB";
    redirect(`/t/portfolio?error=File+too+large.+Maximum+size+is+${label}.`);
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