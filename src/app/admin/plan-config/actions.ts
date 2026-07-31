"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { updatePlanConfig } from "@/lib/db/planConfig";

export async function updatePlanConfigAction(
  formData: FormData
): Promise<void> {
  await requireRole("ADMIN");

  const minTotalReviews = Number(formData.get("minTotalReviews") ?? 0);
  const minFiveStarCount = Number(formData.get("minFiveStarCount") ?? 0);
  const minAverageRating = Number(formData.get("minAverageRating") ?? 0);
  const minFourStarCount = Number(formData.get("minFourStarCount") ?? 0);

  if (
    minTotalReviews < 1 ||
    minFiveStarCount < 1 ||
    minAverageRating < 1 ||
    minAverageRating > 5 ||
    minFourStarCount < 1
  ) {
    redirect(
      "/admin/plan-config?error=Invalid+values.+All+fields+required+and+rating+must+be+between+1+and+5."
    );
  }

  await updatePlanConfig({
    minTotalReviews,
    minFiveStarCount,
    minAverageRating,
    minFourStarCount,
  });

  revalidatePath("/admin/plan-config");
  redirect("/admin/plan-config?success=1");
}