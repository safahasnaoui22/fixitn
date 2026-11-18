import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode, HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4", className)} {...props}>
      {children}
    </div>
  );
}

export { StatusBadge } from "./StatusBadge";

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