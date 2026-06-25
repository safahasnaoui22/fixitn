"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { submitReviewAction } from "./actions";

export function RatingForm({
  requestId,
  technicianName,
}: {
  requestId: string;
  technicianName: string;
}) {
  const [rating, setRating] = useState(0);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const boundAction = submitReviewAction.bind(null, requestId);

  return (
    <form action={boundAction} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>
      )}
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-sm text-muted">Rate your experience with</p>
        <p className="font-heading text-lg font-bold text-ink">{technicianName}</p>
        <StarRating value={rating} onChange={setRating} size={40} className="mt-2" />
        <p className="text-sm font-medium text-muted h-5">
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very good"}
          {rating === 5 && "Excellent!"}
        </p>
      </div>

      <div>
        <label htmlFor="comment" className="text-sm font-medium text-ink">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          placeholder="What went well? Anything to improve?"
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
        />
      </div>

      <Button type="submit" fullWidth size="lg" disabled={rating === 0}>
        Submit Review
      </Button>
    </form>
  );
}