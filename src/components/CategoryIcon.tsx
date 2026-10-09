import {
  Zap,
  Droplets,
  AirVent,
  WashingMachine,
  Refrigerator,
  Tv,
  Hammer,
  KeyRound,
  PaintRoller,
  Sparkles,
  SatelliteDish,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Keys match the `icon` string stored on each seeded Category row.
const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Droplets,
  AirVent,
  WashingMachine,
  Refrigerator,
  Tv,
  Hammer,
  KeyRound,
  PaintRoller,
  Sparkles,
  SatelliteDish,
  Sun,
};

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  badgeSize?: number;
  className?: string;
  /** "dark" = orange icon on a blue tile with a hint of orange; "navy" = white icon on a light-blue tile */
  variant?: "tint" | "dark" | "navy";
}

/** Renders a category's lucide icon inside a soft color-tinted rounded badge. */
export function CategoryIcon({ icon, color, size = 22, badgeSize = 48, className, variant = "tint" }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] ?? Wrench;
  if (variant === "dark" || variant === "navy") {
    const navy = variant === "navy";
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center rounded-2xl", className)}
        style={{
          width: badgeSize,
          height: badgeSize,
          backgroundColor: navy ? "#1A2650" : "rgba(249,115,22,0.13)",
        }}
      >
        <Icon size={size} color={navy ? "#FFFFFF" : "#F97316"} strokeWidth={1.8} />
      </div>
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-2xl", className)}
      style={{ width: badgeSize, height: badgeSize, backgroundColor: `${color}1A` }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </div>
  );
}