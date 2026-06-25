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
}

/** Renders a category's lucide icon inside a soft color-tinted rounded badge. */
export function CategoryIcon({ icon, color, size = 22, badgeSize = 48, className }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] ?? Wrench;
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-2xl", className)}
      style={{ width: badgeSize, height: badgeSize, backgroundColor: `${color}1A` }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </div>
  );
}