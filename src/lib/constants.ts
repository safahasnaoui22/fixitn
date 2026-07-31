export const ROLES = ["CLIENT", "TECHNICIAN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const JOB_STATUS_FLOW = [
  "PENDING",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export const JOB_STATUSES = [...JOB_STATUS_FLOW, "DECLINED", "CANCELLED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "Technician On The Way",
  ARRIVED: "Technician Arrived",
  IN_PROGRESS: "Work In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  ACCEPTED: "ON_THE_WAY",
  ON_THE_WAY: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

export const NEXT_ACTION_LABEL: Partial<Record<JobStatus, string>> = {
  ACCEPTED: "Start Heading Over",
  ON_THE_WAY: "Mark as Arrived",
  ARRIVED: "Start Work",
  IN_PROGRESS: "Mark as Completed",
};

export const NOTIFICATION_TYPES = [
  "NEW_REQUEST",
  "STATUS_UPDATE",
  "NEW_MESSAGE",
  "NEW_REVIEW",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Two plans only — BEGINNER (auto-assigned on registration)
// and SENIOR_PRO (auto-granted when star criteria met, never purchased)
export const PLAN_KEYS = ["BEGINNER", "SENIOR_PRO"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_LABEL: Record<PlanKey, string> = {
  BEGINNER: "Beginner",
  SENIOR_PRO: "Senior Pro",
};

export const BILLING_CYCLES = ["NONE", "MONTHLY", "YEARLY"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PAYMENT_METHODS = ["D17", "FLOUCI", "BANK_TRANSFER", "CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = ["PAYOUT", "COMMISSION", "SUBSCRIPTION"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = ["PAID", "PENDING", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PORTFOLIO_TYPES = ["IMAGE", "VIDEO"] as const;
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number];

export const DEFAULT_CENTER = { latitude: 36.8065, longitude: 10.1815 };
export const SESSION_COOKIE = "fixitn_session";