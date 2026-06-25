"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db/users";
import { createTechnicianProfile } from "@/lib/db/catalog";
import { listPlans } from "@/lib/db/monetization";
import type { Role } from "@/lib/constants";

function fail(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "CLIENT") as Role;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const city = String(formData.get("city") ?? "").trim() || null;

  if (!fullName || !phone || password.length < 6) {
    fail("Fill in your name, phone, and a password of at least 6 characters.");
  }

  const existing = await findUserByPhone(phone);
  if (existing) {
    fail("That phone number is already registered.");
  }

  // Validate technician-only fields *before* creating the User row, so a
  // failed technician-profile step never leaves an orphaned account behind.
  let technicianInput: {
    title: string;
    bio: string | null;
    yearsExperience: number;
    startingPrice: number;
    categoryIds: string[];
  } | null = null;

  if (role === "TECHNICIAN") {
    const title = String(formData.get("title") ?? "").trim();
    const categoryIds = formData.getAll("categoryIds").map(String);
    if (!title || categoryIds.length === 0) {
      fail("Add a title and pick at least one service category.");
    }
    technicianInput = {
      title,
      bio: String(formData.get("bio") ?? "").trim() || null,
      yearsExperience: Number(formData.get("yearsExperience") ?? 0) || 0,
      startingPrice: Number(formData.get("startingPrice") ?? 0) || 0,
      categoryIds,
    };
  }

  const user = await createUser({ fullName, phone, password, role, city });

  if (technicianInput) {
    const plans = await listPlans();
    const freePlan = plans.find((p) => p.key === "FREE") ?? plans[0];
    await createTechnicianProfile({
      userId: user.id,
      ...technicianInput,
      planId: freePlan?.id ?? "",
    });
  }

  await createSession({ userId: user.id, role: user.role, fullName: user.fullName });
  redirect(role === "TECHNICIAN" ? "/t/dashboard" : "/");
}