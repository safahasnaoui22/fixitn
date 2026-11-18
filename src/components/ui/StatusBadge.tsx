"use client";

import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/constants";
import { useT } from "@/lib/i18n/I18nProvider";

const STATUS_STYLES: Record<JobStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  ON_THE_WAY: "bg-blue-50 text-blue-700",
  ARRIVED: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-brand-orange-light text-brand-orange-dark",
  COMPLETED: "bg-success-light text-success",
  DECLINED: "bg-danger-light text-danger",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const STATUS_STYLES_DARK: Record<JobStatus, string> = {
  PENDING: "bg-amber-400/15 text-amber-300",
  ACCEPTED: "bg-blue-400/15 text-blue-300",
  ON_THE_WAY: "bg-blue-400/15 text-blue-300",
  ARRIVED: "bg-indigo-400/15 text-indigo-300",
  IN_PROGRESS: "bg-orange-400/15 text-orange-300",
  COMPLETED: "bg-emerald-400/15 text-emerald-300",
  DECLINED: "bg-red-400/15 text-red-300",
  CANCELLED: "bg-white/10 text-white/60",
};

export function StatusBadge({
  status,
  className,
  dark,
}: {
  status: JobStatus;
  className?: string;
  dark?: boolean;
}) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        (dark ? STATUS_STYLES_DARK : STATUS_STYLES)[status],
        className
      )}
    >
      {t(`jobStatus.${status}`)}
    </span>
  );
}

