"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { uploadFile } from "@/lib/cloudinary";
import { toStringArray } from "@/lib/utils";

// Vercel rejects request bodies above ~4.5 MB, so keep the image under 4 MB.
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

/** Reads the optional image field. Returns {url} when uploaded, {error} when invalid, {} when none. */
async function readImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return {};
  if (!ACCEPTED_IMAGES.includes(file.type)) {
    return { error: "Image must be JPG, PNG or WEBP." };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "Image is too large (max 4 MB). Please compress it." };
  }
  try {
    const { url } = await uploadFile(file, "categories");
    return { url };
  } catch {
    return { error: "Image upload failed. Check the Cloudinary settings." };
  }
}

function readSteps(formData: FormData): string[] {
  return String(formData.get("howItWorks") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function fail(message: string): never {
  redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const visitPrice = Number(formData.get("visitPrice") ?? 0) || 0;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const howItWorks = readSteps(formData);

  if (!name || !icon || !color) {
    fail("Name, icon and color are required.");
  }

  const image = await readImage(formData);
  if (image.error) fail(image.error);

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
  });

  if (!slug) fail("Please use letters or numbers in the name.");
  if (await prisma.category.findUnique({ where: { slug } })) {
    fail(`A category with the slug "${slug}" already exists.`);
  }

  await prisma.category.create({
    data: {
      slug,
      name,
      icon,
      color,
      description,
      visitPrice,
      videoUrl,
      imageUrl: image.url ?? null,
      howItWorks: howItWorks.length ? toStringArray(howItWorks) : null,
      isActive: true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const visitPrice = Number(formData.get("visitPrice") ?? 0) || 0;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const howItWorks = readSteps(formData);
  const removeImage = formData.get("removeImage") === "on";

  if (!id || !name || !icon || !color) {
    fail("Name, icon and color are required.");
  }

  const image = await readImage(formData);
  if (image.error) fail(image.error);

  await prisma.category.update({
    where: { id },
    data: {
      name,
      icon,
      color,
      description,
      visitPrice,
      videoUrl,
      howItWorks: howItWorks.length ? toStringArray(howItWorks) : null,
      // new upload replaces the old image; "remove" clears it; otherwise keep it
      ...(image.url ? { imageUrl: image.url } : removeImage ? { imageUrl: null } : {}),
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/category", "layout");
  redirect("/admin/categories");
}

export async function toggleCategoryActiveAction(
  id: string,
  isActive: boolean
): Promise<void> {
  await requireRole("ADMIN");

  await prisma.category.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateVisitPriceAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireRole("ADMIN");

  const visitPrice = Number(formData.get("visitPrice") ?? 0);

  await prisma.category.update({
    where: { id },
    data: { visitPrice },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function reorderCategoryAction(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  await requireRole("ADMIN");

  const all = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const idx = all.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return;

  await prisma.$transaction([
    prisma.category.update({
      where: { id: all[idx].id },
      data: { sortOrder: all[swapIdx].sortOrder },
    }),
    prisma.category.update({
      where: { id: all[swapIdx].id },
      data: { sortOrder: all[idx].sortOrder },
    }),
  ]);

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireRole("ADMIN");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}