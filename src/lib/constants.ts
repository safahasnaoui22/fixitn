// Roles
export const ROLES = ["CLIENT", "TECHNICIAN", "ADMIN", "SOUS_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// Job statuses
export const JOB_STATUS_FLOW = [
  "PENDING",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export const JOB_STATUSES = [
  ...JOB_STATUS_FLOW,
  "DECLINED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  PENDING:     "Pending",
  ACCEPTED:    "Accepted",
  ON_THE_WAY:  "Technician On The Way",
  ARRIVED:     "Technician Arrived",
  IN_PROGRESS: "Work In Progress",
  COMPLETED:   "Completed",
  DECLINED:    "Declined",
  CANCELLED:   "Cancelled",
};

export const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  ACCEPTED:    "ON_THE_WAY",
  ON_THE_WAY:  "ARRIVED",
  ARRIVED:     "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

export const NEXT_ACTION_LABEL: Partial<Record<JobStatus, string>> = {
  ACCEPTED:    "Départ — Start Heading Over",
  ON_THE_WAY:  "Mark as Arrived",
  ARRIVED:     "Start Work",
  IN_PROGRESS: "Mark as Completed",
};

// Notifications
export const NOTIFICATION_TYPES = [
  "NEW_REQUEST",
  "STATUS_UPDATE",
  "NEW_MESSAGE",
  "NEW_REVIEW",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Plans — FREE / BEGINNER / PRO
export const PLAN_KEYS = ["FREE", "BEGINNER", "PRO"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_LABEL: Record<PlanKey, string> = {
  FREE:     "Free",
  BEGINNER: "Beginner",
  PRO:      "Pro",
};

// Visibility radius per plan (km)
export const PLAN_RADIUS: Record<PlanKey, number> = {
  FREE:     10,
  BEGINNER: 30,
  PRO:      150,
};

// Commission per plan
export const PLAN_COMMISSION: Record<PlanKey, number> = {
  FREE:     0.20,
  BEGINNER: 0.15,
  PRO:      0.08,
};

// Technician account approval statuses
export const ACCOUNT_STATUSES = [
  "PENDING",
  "ACTIVE",
  "DECLINED",
  "ARCHIVED",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  PENDING:  "Pending Approval",
  ACTIVE:   "Active",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
};

// Billing
export const BILLING_CYCLES = ["NONE", "MONTHLY", "YEARLY"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

// Payments
export const PAYMENT_METHODS = [
  "D17",
  "FLOUCI",
  "BANK_TRANSFER",
  "CASH",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = [
  "PAYOUT",
  "COMMISSION",
  "SUBSCRIPTION",
] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = ["PAID", "PENDING", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Portfolio
export const PORTFOLIO_TYPES = ["IMAGE", "VIDEO"] as const;
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number];

// Transport
export const TRANSPORT_RATE_DT_PER_KM = 1; // 1 DT per km

// Map defaults
export const DEFAULT_CENTER = {
  latitude: 36.8065,
  longitude: 10.1815,
};

// Cookie names
export const SESSION_COOKIE = "fixitn_session";