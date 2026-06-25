"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

export function StarRating({ value, onChange, size = 18, className }: StarRatingProps) {
  const interactive = !!onChange;
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          tabIndex={interactive ? 0 : -1}
          onClick={() => onChange?.(n)}
          className={cn(!interactive && "cursor-default", interactive && "transition-transform active:scale-90")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={n <= Math.round(value) ? "fill-star text-star" : "fill-transparent text-line"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}