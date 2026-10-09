import type {
  JobStatus,
  Role,
  NotificationType,
  PlanKey,
  BillingCycle,
  PaymentMethod,
  PaymentType,
  PaymentStatus,
  SubscriptionStatus,
  PortfolioType,
  AccountStatus,
} from "./constants";
export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  role: Role;
  city: string | null;
  address: string | null;
  avatarUrl: string | null;
  faceDescriptor: string | null;
  sessionVersion: number;
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash" | "faceDescriptor">;

export interface KnownDevice {
  id: string;
  userId: string;
  deviceToken: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface Technician {
  id: string;
  userId: string;
  title: string;
  bio: string | null;
  yearsExperience: number;
  startingPrice: number;
  latitude: number;
  longitude: number;
  verified: boolean;
  galleryImages: string[];
  cinUrl: string | null;
  diplomeUrl: string | null;
  isSenior: boolean;
  seniorSince: string | null;
  accountStatus: AccountStatus;

  departureLatitude: number | null;
  departureLongitude: number | null;
  departureAt: string | null;
  distanceTraveled: number | null;
  transportFee: number | null;

  planId: string | null;
  createdAt: string;
}

export interface TechnicianWithUser extends Technician {
  fullName: string;
  avatarUrl: string | null;
  phone: string;
  ratingAvg: number | null;
  ratingCount: number;
}

export interface PortfolioItem {
  id: string;
  technicianId: string;
  type: PortfolioType;
  url: string;
  publicId: string;
  caption: string | null;
  createdAt: string;
}

export interface PlanConfig {
  id: string;
  minTotalReviews: number;
  minFiveStarCount: number;
  minAverageRating: number;
  minFourStarCount: number;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  howItWorks: string[];
  videoUrl: string | null;
  imageUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  sortOrder: number;
  isActive: boolean;
  visitPrice: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  technicianId: string;
  categoryId: string;
  fullName: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  photos: string[];
  status: JobStatus;
  clientConfirmedSolved: boolean | null;
  pendingAt: string;
  acceptedAt: string | null;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  inProgressAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestWithRelations extends ServiceRequest {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  technicianUserId: string;
  technicianTitle: string;
  technicianFullName: string;
  technicianAvatarUrl: string | null;
  clientFullName: string;
  clientAvatarUrl: string | null;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface MessageWithSender extends Message {
  senderFullName: string;
  senderAvatarUrl: string | null;
}

export interface Review {
  id: string;
  requestId: string;
  technicianId: string;
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewWithAuthor extends Review {
  authorFullName: string;
  authorAvatarUrl: string | null;
}

export interface Plan {
  id: string;
  key: PlanKey;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  commissionRate: number;
  maxRequestsPerMonth: number | null;
  priorityVisibility: boolean;
  radiusKm: number;
  features: string[];
  badge: string | null;
}

export interface Subscription {
  id: string;
  technicianId: string;
  planId: string;
  startedAt: string;
  expiresAt: string | null;
  status: SubscriptionStatus;
}

export interface Payment {
  id: string;
  technicianId: string;
  requestId: string | null;
  amount: number;
  platformFee: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: PaymentType;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  requestId: string | null;
  read: boolean;
  createdAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

// --- Session payloads -------------------------------------------------

export interface SessionPayload {
  userId: string;
  role: Role;
  fullName: string;
  sessionVersion: number;
  faceSetup: boolean;
  deviceVerified: boolean;
  accountApproved?: boolean; // undefined for non-technicians, true/false for technicians
}

export interface PendingSessionPayload {
  pendingUserId: string;
  pendingFullName: string;
  pendingRole: Role;
  sessionVersion: number;
}