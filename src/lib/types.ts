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
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

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
  planId: string | null;
  createdAt: string;
}

/** Technician joined with its User row + computed review stats — what most screens need. */
export interface TechnicianWithUser extends Technician {
  fullName: string;
  avatarUrl: string | null;
  phone: string;
  ratingAvg: number | null;
  ratingCount: number;
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
  ratingAvg: number | null;
  ratingCount: number | null;
  sortOrder: number;
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

/** A request enriched with the bits the list/detail screens render directly. */
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

export interface SessionPayload {
  userId: string;
  role: Role;
  fullName: string;
}