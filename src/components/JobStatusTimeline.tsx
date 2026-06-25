import { Check, Clock, X } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { JOB_STATUS_FLOW, JOB_STATUS_LABEL, type JobStatus } from "@/lib/constants";

type FlowStatus = (typeof JOB_STATUS_FLOW)[number];
type TimestampKey = "pendingAt" | "acceptedAt" | "onTheWayAt" | "arrivedAt" | "inProgressAt" | "completedAt";

interface JobStatusTimelineProps {
  status: JobStatus;
  pendingAt: string;
  acceptedAt: string | null;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  inProgressAt: string | null;
  completedAt: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  className?: string;
}

const TIMESTAMP_KEY: Record<FlowStatus, TimestampKey> = {
  PENDING: "pendingAt",
  ACCEPTED: "acceptedAt",
  ON_THE_WAY: "onTheWayAt",
  ARRIVED: "arrivedAt",
  IN_PROGRESS: "inProgressAt",
  COMPLETED: "completedAt",
};

export function JobStatusTimeline(props: JobStatusTimelineProps) {
  const { status, declinedAt, cancelledAt, className } = props;

  // Declined/cancelled are terminal off-ramps, not a point on the happy-path
  // flow, so they get their own simple one-line state instead of the timeline.
  if (status === "DECLINED" || status === "CANCELLED") {
    const isDeclined = status === "DECLINED";
    const ts = isDeclined ? declinedAt : cancelledAt;
    return (
      <div className={cn("flex items-start gap-3 animate-fade-up", className)}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-light text-danger">
          <X size={18} strokeWidth={2.5} />
        </div>
        <div className="pt-1.5">
          <p className="font-heading text-sm font-semibold text-ink">
            {isDeclined ? "Request Declined" : "Request Cancelled"}
          </p>
          {ts && (
            <p className="text-xs text-muted">
              {formatDate(ts)} · {formatTime(ts)}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = JOB_STATUS_FLOW.indexOf(status as FlowStatus);

  return (
    <div className={cn("flex flex-col", className)}>
      {JOB_STATUS_FLOW.map((step, i) => {
        const ts = props[TIMESTAMP_KEY[step]];
        const isDone = i < currentIndex || (i === currentIndex && step === "COMPLETED");
        const isCurrent = i === currentIndex && step !== "COMPLETED";
        const isLast = i === JOB_STATUS_FLOW.length - 1;

        return (
          <div key={step} className="flex items-start gap-3 animate-fade-up">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isDone && "border-success bg-success text-white",
                  isCurrent && "border-brand-orange bg-brand-orange-light text-brand-orange animate-pulse",
                  !isDone && !isCurrent && "border-line bg-surface text-muted"
                )}
              >
                {isDone ? <Check size={16} strokeWidth={3} /> : <Clock size={15} />}
              </div>
              {!isLast && (
                <div className={cn("min-h-8 w-0.5 flex-1", i < currentIndex ? "bg-success" : "bg-line")} />
              )}
            </div>
            <div className={cn("pb-7", isLast && "pb-0")}>
              <p
                className={cn(
                  "font-heading text-sm font-semibold",
                  isDone || isCurrent ? "text-ink" : "text-muted"
                )}
              >
                {JOB_STATUS_LABEL[step]}
              </p>
              {ts ? (
                <p className="text-xs text-muted">
                  {formatDate(ts)} · {formatTime(ts)}
                </p>
              ) : isCurrent ? (
                <p className="text-xs font-medium text-brand-orange">In progress…</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}