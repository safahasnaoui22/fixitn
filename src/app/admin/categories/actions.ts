"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  createAdminCategory,
  updateAdminCategory,
  reorderAdminCategory,
  deleteAdminCategory,
} from "@/lib/db/admin";

export async function createCategoryAction(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || !icon || !color) redirect("/admin/categories?error=All+fields+required");
  await createAdminCategory({ name, icon, color, description });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id || !name || !icon || !color) redirect("/admin/categories?error=All+fields+required");
  await updateAdminCategory(id, { name, icon, color, description });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function reorderCategoryAction(id: string, direction: "up" | "down") {
  await requireRole("ADMIN");
  await reorderAdminCategory(id, direction);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireRole("ADMIN");
  await deleteAdminCategory(id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}