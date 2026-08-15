"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const visitPrice = Number(formData.get("visitPrice") ?? 0) || 0;

  if (!name || !icon || !color) {
    redirect("/admin/categories?error=All+fields+required");
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
  });

  await prisma.category.create({
    data: {
      slug,
      name,
      icon,
      color,
      description,
      visitPrice,
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

  if (!id || !name || !icon || !color) {
    redirect("/admin/categories?error=All+fields+required");
  }

  await prisma.category.update({
    where: { id },
    data: { name, icon, color, description, visitPrice },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
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