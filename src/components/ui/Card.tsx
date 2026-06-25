import { cn } from "@/lib/utils";
import { JOB_STATUS_LABEL, type JobStatus } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";
import type { ReactNode, HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4", className)} {...props}>
      {children}
    </div>
  );
}

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

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status],
        className
      )}
    >
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-8 py-16 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt text-muted">
        <Icon size={28} />
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}