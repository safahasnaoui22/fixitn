// Stand-ins for what would be Prisma `enum`s if this were Postgres. Every
// "enum-like" column in schema.prisma is a plain String for SQLite
// compatibility — these are the single source of truth for the valid values.

export const ROLES = ["CLIENT", "TECHNICIAN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// The happy-path order matters: it drives the JobStatusTimeline component.
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

// What a technician sees as the single next action from their current status.
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

export const PLAN_KEYS = ["FREE", "PRO_MONTHLY", "PRO_YEARLY"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

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

// Tunis city center — used as the distance-calculation fallback when a
// client's browser geolocation is unavailable or denied.
export const DEFAULT_CENTER = { latitude: 36.8065, longitude: 10.1815 };

export const SESSION_COOKIE = "fixitn_session";