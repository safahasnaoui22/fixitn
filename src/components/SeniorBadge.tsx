import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface SeniorBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE: Record<string, string> = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2 py-0.5 text-xs gap-1",
  lg: "px-3 py-1 text-sm gap-1.5",
};

const ICON_SIZE: Record<string, number> = { sm: 10, md: 12, lg: 14 };

export function SeniorBadge({ className, size = "md" }: SeniorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold",
        "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm",
        SIZE[size],
        className
      )}
    >
      <ShieldCheck size={ICON_SIZE[size]} strokeWidth={2.5} />
      Senior Pro
    </span>
  );
}